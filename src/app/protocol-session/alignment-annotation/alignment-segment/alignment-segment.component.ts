import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {SequenceAlignment} from "../../../sequence-alignment";

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
  @ViewChild('canvasElem') canvasElem?: ElementRef;

  ngAfterViewInit() {
    this.drawCanvas()
  }

  drawCanvas() {
    if (this.canvasElem){
      const canvas: HTMLCanvasElement = this.canvasElem.nativeElement;
      const ctx = canvas.getContext('2d');

      if (ctx && this.sequenceAlignment) {
        const cellWidth: number = 20;
        const cellHeight = canvas.height / (this.sequenceAlignment.alignmentIDs.length + 1);
        const width = (this.sequenceAlignment.alignmentMap.get(this.sequenceAlignment.alignmentIDs[0])!.length + this.cellOffset + 1) * cellWidth;
        const height = (this.sequenceAlignment.alignmentIDs.length+1) * cellHeight;
        canvas.width = width;
        canvas.height = height;
        this.canvasDrawSequence(ctx, cellWidth, cellHeight, this.sequenceAlignment)
        const seq = this.sequenceAlignment.alignmentMap.get(this.sequenceAlignment.alignmentIDs[0]);
        if (seq) {
          this.canvasDrawResiduePosition(seq, ctx, cellWidth)
        }
        console.log(canvas.width)
        this.canvasDrawConservationScores(ctx, cellWidth, cellHeight, this.sequenceAlignment.conservationScores, height)
        //this.canvasAddHover(ctx, cellWidth, cellHeight, this.sequenceAlignment, canvas)
      }
    }
  }

  canvasDrawResiduePosition(seq: string, ctx: CanvasRenderingContext2D, cellWidth: number) {
    for (let j = 0; j < seq.length; j++) {
      if (this.start > 0 && this.end > 0) {
        if ((j + 1) % 10 === 0) {
          ctx.textBaseline = 'top'; // align text with the top of the canvas
          ctx.fillText((j + 1).toString(), (this.cellOffset + 1+ j+0.25 - this.start) * cellWidth, 0); // draw the position text on top of the canvas
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
    for (let i = 0; i < seqAlignment.alignmentIDs.length; i++) {
      const seq = seqAlignment.alignmentMap.get(seqAlignment.alignmentIDs[i]);
      if (seq) {
        // Save the current context state
        ctx.save();

        // Define a clipping region
        ctx.beginPath();
        ctx.rect(0, i * cellHeight, (this.cellOffset+1) * cellWidth, cellHeight);
        ctx.clip();
        // Draw the ID of the sequence
        ctx.textBaseline = 'middle'; // align text with the middle of the cell
        ctx.fillText(seqAlignment.alignmentIDs[i], 0, (i + 0.5) * cellHeight); // draw the ID text at the beginning of the sequence

        // Restore the context state
        ctx.restore();
        if (this.start > 0 && this.end > 0) {
          for (let j = 0; j < seq.length; j++) {
            if (j >= this.start-1 && j < this.end) {
              const residue = seq[j];
              // if the residue is in the highlightSectionsMap, draw the residue with a different color
              this.canvasDrawSequenceCell(ctx, cellWidth, cellHeight, residue, this.cellOffset + j + 1 - this.start, i)
              if (this.highlightSectionsMap[seqAlignment.alignmentIDs[i]]) {
                const highlightSections = this.highlightSectionsMap[seqAlignment.alignmentIDs[i]];
                const isHighlighted = highlightSections.some((section) => j >= section.start && j < section.end);
                if (isHighlighted) {
                  this.canvasDrawSequenceCell(ctx, cellWidth, cellHeight, residue, this.cellOffset + j + 1 - this.start, i, 'rgba(255, 0, 0, 0.5)')
                }
              }
            }

          }
        } else {
          for (let j = 0; j < seq.length; j++) {
            const residue = seq[j];
            // if the residue is in the highlightSectionsMap, draw the residue with a different color
            this.canvasDrawSequenceCell(ctx, cellWidth, cellHeight, residue, this.cellOffset + j + 1, i)
            if (this.highlightSectionsMap[seqAlignment.alignmentIDs[i]]) {
              const highlightSections = this.highlightSectionsMap[seqAlignment.alignmentIDs[i]];
              const isHighlighted = highlightSections.some((section) => j >= section.start && j < section.end);
              if (isHighlighted) {
                this.canvasDrawSequenceCell(ctx, cellWidth, cellHeight, residue, this.cellOffset + j + 1, i, 'rgba(255, 0, 0, 0.5)')
              }
            }
          }
          //this.canvasDrawSequenceCell(ctx, cellWidth, cellHeight, residue, this.cellOffset + j + 1, i) // start drawing the sequence from the second cell
        }
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
