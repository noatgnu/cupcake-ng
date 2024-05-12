import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {SequenceAlignment} from "../../../sequence-alignment";
import {DataService} from "../../../data.service";

@Component({
  selector: 'app-alignment-segment',
  standalone: true,
  imports: [],
  templateUrl: './alignment-segment.component.html',
  styleUrl: './alignment-segment.component.scss'
})
export class AlignmentSegmentComponent implements AfterViewInit {
  @Input() cellWidth: number = 20
  @Input() cellHeight: number = 20
  @Input() cellOffset: number = 5
  @Input() highlightSectionsMap: {[key: string]: {start: number, end: number}[]} = {}
  @Input() start: number = 0
  @Input() end: number = 0
  @Input() sequenceAlignment: SequenceAlignment = new SequenceAlignment('', 'fasta')
  @Input() enableThreeFrame: boolean = false
  @ViewChild('canvasElem') canvasElem?: ElementRef;
  @Output() dataURL: EventEmitter<string> = new EventEmitter<string>()
  @Input() cellOffsetTop: number = 1
  @Input() threeFrameHighlight: {[key: string]: {[key: string]: {start: number, end: number}[]}} = {}

  constructor(private dataService: DataService) {
    this.dataService.redrawSubject.subscribe(() => {
      this.drawCanvas()
    })
  }

  ngAfterViewInit() {
    this.drawCanvas()
  }

  drawCanvas() {
    if (this.canvasElem){
      const canvas: HTMLCanvasElement = this.canvasElem.nativeElement;
      const ctx = canvas.getContext('2d');
      if (ctx && this.sequenceAlignment) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // clear the canvas
        const cellWidth: number = this.cellWidth;
        const cellHeight = this.cellHeight;
        let width = (this.sequenceAlignment.alignmentMap.get(this.sequenceAlignment.alignmentIDs[0])!.length + this.cellOffset + 1) * cellWidth;
        if (this.start > 0 && this.end > 0) {
          width = (this.end - this.start + this.cellOffset + 1) * cellWidth;
        }
        let height = (this.sequenceAlignment.alignmentIDs.length+1+this.cellOffsetTop) * cellHeight;
        if (this.sequenceAlignment.sequenceType === 'nucleotide' && this.sequenceAlignment.threeFrame && this.enableThreeFrame) {
          height = (1 + (this.sequenceAlignment.alignmentIDs.length+1+this.cellOffsetTop) * Object.keys(this.sequenceAlignment.threeFrame).length) * cellHeight;
        }
        canvas.width = width;
        canvas.height = height;
        this.canvasDrawSequence(ctx, cellWidth, cellHeight, this.sequenceAlignment)
        const seq = this.sequenceAlignment.alignmentMap.get(this.sequenceAlignment.alignmentIDs[0]);
        if (seq) {
          this.canvasDrawResiduePosition(seq, ctx, cellWidth)
        }

        this.canvasDrawConservationScores(ctx, cellWidth, cellHeight, this.sequenceAlignment.conservationScores, height)
        //this.canvasAddHover(ctx, cellWidth, cellHeight, this.sequenceAlignment, canvas)
        this.dataURL.emit(canvas.toDataURL('image/png'))
      }
    }
  }

  canvasDrawResiduePosition(seq: string, ctx: CanvasRenderingContext2D, cellWidth: number) {
    for (let j = 0; j < seq.length; j++) {
      if (this.start > 0 && this.end > 0) {
        if (j >= this.start-1 && j < this.end) {
          if ((j + 1) % 10 === 0) {
            ctx.textBaseline = 'top'; // align text with the top of the canvas
            ctx.fillText((j + 1).toString(), (this.cellOffset + 2+ j+0.25 - this.start) * cellWidth, 0); // draw the position text on top of the canvas
          }
        }

      } else {
        if ((j + 1) % 10 === 0) {
          ctx.textBaseline = 'top'; // align text with the top of the canvas
          ctx.fillText((j + 1).toString(), (this.cellOffset + 1+ j+0.25) * cellWidth, 0); // draw the position text on top of the canvas
        }
      }

    }
  }

  canvasDrawSequence(ctx: CanvasRenderingContext2D, cellWidth: number, cellHeight: number, seqAlignment: SequenceAlignment) {
    let sequenceCount = 0 + this.cellOffsetTop
    for (let i = 0; i < seqAlignment.alignmentIDs.length; i++) {
      const seq = seqAlignment.alignmentMap.get(seqAlignment.alignmentIDs[i]);
      if (seq) {
        // Save the current context state
        ctx.save();

        // Define a clipping region
        ctx.beginPath();
        if (this.sequenceAlignment.sequenceType === 'nucleotide' && this.sequenceAlignment.threeFrame) {
          ctx.rect(0, sequenceCount * cellHeight, (this.cellOffset+1) * cellWidth, cellHeight);
          ctx.clip();
          // Draw the ID of the sequence
          ctx.textBaseline = 'middle'; // align text with the middle of the cell
          ctx.fillText(seqAlignment.alignmentIDs[i], 0, (sequenceCount + 0.5) * cellHeight); // draw the ID text at the beginning of the sequence

        } else {
          ctx.rect(0, sequenceCount * cellHeight, (this.cellOffset+1) * cellWidth, cellHeight);
          ctx.clip();
          // Draw the ID of the sequence
          ctx.textBaseline = 'middle'; // align text with the middle of the cell
          ctx.fillText(seqAlignment.alignmentIDs[i], 0, (sequenceCount + 0.5) * cellHeight); // draw the ID text at the beginning of the sequence

        }


        // Restore the context state
        ctx.restore();
        if (this.start > 0 && this.end > 0) {
          console.log(this.sequenceAlignment.sequenceType)
          for (let j = 0; j < seq.length; j++) {
            if (j >= this.start-1 && j < this.end) {
              const residue = seq[j];
              // if the residue is in the highlightSectionsMap, draw the residue with a different color
              this.canvasDrawSequenceCell(ctx, cellWidth, cellHeight, residue, this.cellOffset + j + 2 - this.start, sequenceCount)
              if (this.highlightSectionsMap[seqAlignment.alignmentIDs[i]]) {
                const highlightSections = this.highlightSectionsMap[seqAlignment.alignmentIDs[i]];
                const isHighlighted = highlightSections.some((section) => j >= section.start && j < section.end);
                if (isHighlighted) {
                  this.canvasDrawSequenceCell(ctx, cellWidth, cellHeight, residue, this.cellOffset + j + 2 - this.start, sequenceCount, 'rgba(255, 0, 0, 0.5)')
                }
              }
            }
          }
          if (this.sequenceAlignment.sequenceType === 'nucleotide' && this.sequenceAlignment.threeFrame) {
            // draw the three frame with offset and start with start and stop range of the nucleotide sequence
            if (this.enableThreeFrame) {
              for (const frame in this.sequenceAlignment.threeFrame[seqAlignment.alignmentIDs[i]]) {
                sequenceCount ++
                const frameTranslation = this.sequenceAlignment.threeFrame[seqAlignment.alignmentIDs[i]][frame];
                // calculate start and end position of the translation for the frame
                const frameNumber = parseInt(frame);
                for (const translation of frameTranslation) {
                  console.log(translation, this.start, this.end, frameNumber)
                  if (translation.start+frameNumber+1 >= this.start-1 && translation.end+frameNumber+1 < this.end) {
                    this.canvasDrawSequenceCell(ctx, cellWidth, cellHeight, translation.residue, this.cellOffset + (translation.start + translation.end)/2 + 1 - this.start+frameNumber+1, sequenceCount)
                  }
                }
                if (this.threeFrameHighlight) {
                  if (this.threeFrameHighlight[seqAlignment.alignmentIDs[i]]) {
                    if (this.threeFrameHighlight[seqAlignment.alignmentIDs[i]][frame]) {
                      const highlightFrameSections = this.threeFrameHighlight[seqAlignment.alignmentIDs[i]][frame];

                      for (const section of highlightFrameSections) {
                        console.log(section)

                        for (const translation of frameTranslation.slice(section.start, section.end+1)) {
                          if (translation.start >= this.start-1 && translation.end < this.end) {
                            for (let j = translation.start; j <= translation.end; j++) {
                              if (j+frameNumber+1 >= this.start-1 && j+frameNumber+1 < this.end) {
                                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                                ctx.fillRect((this.cellOffset + j + 1 - this.start+frameNumber+1) * cellWidth, sequenceCount * cellHeight, cellWidth, cellHeight)
                              }
                            }
                          }
                        }

                      }
                    }
                  }
                }
              }
            }

          }
        } else {
          if (this.sequenceAlignment.sequenceType === 'nucleotide' && this.sequenceAlignment.threeFrame) {
            for (let j = 0; j < seq.length; j++) {
              const residue = seq[j];
              this.canvasDrawSequenceCell(ctx, cellWidth, cellHeight, residue, this.cellOffset + j + 1, sequenceCount)
              if (this.highlightSectionsMap[seqAlignment.alignmentIDs[i]]) {
                const highlightSections = this.highlightSectionsMap[seqAlignment.alignmentIDs[i]];
                const isHighlighted = highlightSections.some((section) => j >= section.start && j < section.end);
                if (isHighlighted) {
                  this.canvasDrawSequenceCell(ctx, cellWidth, cellHeight, residue, this.cellOffset + j + 1, sequenceCount, 'rgba(255, 0, 0, 0.5)')
                }

              }
            }

            if (this.enableThreeFrame) {
              for (const frame in this.sequenceAlignment.threeFrame[seqAlignment.alignmentIDs[i]]) {
                sequenceCount ++
                const frameTranslation = this.sequenceAlignment.threeFrame[seqAlignment.alignmentIDs[i]][frame];
                console.log(frameTranslation)
                for (const translation of frameTranslation) {
                  this.canvasDrawSequenceCell(ctx, cellWidth, cellHeight, translation.residue, this.cellOffset + (translation.start + translation.end)/2 + 1, sequenceCount)
                }
                console.log(this.threeFrameHighlight)
                if (this.threeFrameHighlight) {
                  if (this.threeFrameHighlight[seqAlignment.alignmentIDs[i]]) {
                    if (this.threeFrameHighlight[seqAlignment.alignmentIDs[i]][frame]) {
                      const highlightFrameSections = this.threeFrameHighlight[seqAlignment.alignmentIDs[i]][frame];

                      for (const section of highlightFrameSections) {
                        const startPosition = frameTranslation[section.start].start;
                        const endPosition = frameTranslation[section.end].end;
                        if (this.start > 0 && this.end > 0) {
                          if (startPosition >= this.start-1 && endPosition < this.end) {
                            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                            ctx.fillRect((this.cellOffset + startPosition + 1 - this.start) * cellWidth, sequenceCount * cellHeight, cellWidth * (endPosition - startPosition + 1), cellHeight)
                          }
                        } else {
                          ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                          ctx.fillRect((this.cellOffset + startPosition + 1) * cellWidth, sequenceCount * cellHeight, cellWidth * (endPosition - startPosition + 1), cellHeight)
                        }
                      }
                    }
                  }
                }
              }
            }
          } else {
            for (let j = 0; j < seq.length; j++) {
              const residue = seq[j];

              this.canvasDrawSequenceCell(ctx, cellWidth, cellHeight, residue, this.cellOffset + j + 1, sequenceCount)
              if (this.highlightSectionsMap[seqAlignment.alignmentIDs[i]]) {
                const highlightSections = this.highlightSectionsMap[seqAlignment.alignmentIDs[i]];
                const isHighlighted = highlightSections.some((section) => j >= section.start && j < section.end);
                if (isHighlighted) {
                  this.canvasDrawSequenceCell(ctx, cellWidth, cellHeight, residue, this.cellOffset + j + 1, sequenceCount, 'rgba(255, 0, 0, 0.5)')
                }

              }
            }
          }
          //this.canvasDrawSequenceCell(ctx, cellWidth, cellHeight, residue, this.cellOffset + j + 1, i) // start drawing the sequence from the second cell
        }
        sequenceCount ++
      }

    }
  }

  canvasDrawSequenceCell(ctx: CanvasRenderingContext2D, cellWidth: number, cellHeight: number, cellText: string, cellPositionX: number, cellPositionY: number, backgroundColor: string = 'white') {
    ctx.fillStyle = backgroundColor; // use different colors for different residues
    ctx.fillRect(cellPositionX * cellWidth, cellPositionY * cellHeight, cellWidth, cellHeight);
    ctx.fillStyle = 'black'; // color for the text
    ctx.fillText(cellText, (cellPositionX+0.25) * cellWidth, (cellPositionY + 0.5) * cellHeight); // draw the residue text
  }

  canvasDrawConservationScores(ctx: CanvasRenderingContext2D, cellWidth: number, cellHeight: number, conservationScores: number[], canvasHeight: number) {
    if (this.start > 0 && this.end > 0) {
      for (let i = 0; i < conservationScores.length; i++) {
        if (i >= this.start-1 && i < this.end) {
          const score = conservationScores[i];
          ctx.fillStyle = `rgba(0, 0, 0, ${score})`; // use gradient color for conservation scores
          ctx.fillRect(
            (this.cellOffset + 2 + i - this.start) * cellWidth,
            canvasHeight - cellHeight * score,
            cellWidth,
            cellHeight * score
          );
        }
      }
    } else {
      for (let i = 0; i < conservationScores.length; i++) {
        const score = conservationScores[i];
        ctx.fillStyle = `rgba(0, 0, 0, ${score})`; // use gradient color for conservation scores
        ctx.fillRect(
          (this.cellOffset + 1 + i) * cellWidth,
          canvasHeight - cellHeight * score,
          cellWidth,
          cellHeight * score
        );
      }
    }
  }




}
