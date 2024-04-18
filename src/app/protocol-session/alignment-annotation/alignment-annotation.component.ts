import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {SequenceAlignment} from "../../sequence-alignment";
import {Annotation} from "../../annotation";
import {WebService} from "../../web.service";
import {FormBuilder, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {AlignmentSegmentComponent} from "./alignment-segment/alignment-segment.component";

@Component({
  selector: 'app-alignment-annotation',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AlignmentSegmentComponent
  ],
  templateUrl: './alignment-annotation.component.html',
  styleUrl: './alignment-annotation.component.scss'
})
export class AlignmentAnnotationComponent implements AfterViewInit{
  _annotation?: Annotation
  sequenceAlignment?: SequenceAlignment
  previousHoveredResidue?: {i: number, j: number}
  cellWidth = 20
  cellHeight = 20
  cellOffset = 5
  highlightSectionsMap: {[key: string]: {start: number, end: number}[]} = {}
  extractedSegments: {start: number, end: number}[] = []
  editMode = false

  @Input() set annotation(value: Annotation) {
    this._annotation = value
    console.log(value)
  }

  get annotation(): Annotation {
    return this._annotation!
  }

  form = this.fb.group({
    searchTerm: [""],
    gap: [false]
  })

  formExtract = this.fb.group({
    start: [0],
    end: [0]
  })

  constructor(private web: WebService, private fb: FormBuilder) {

  }

  fileUploadHandler(event: Event) {
    const target = event.target as HTMLInputElement
    if (!target.files || target.files.length === 0) {
      return
    }
    const file = target.files[0]
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const alignment = new SequenceAlignment(text, 'fasta')
    }
    reader.readAsText(file)
  }

  ngAfterViewInit() {
    this.web.getAnnotationFile(this.annotation.id, true).subscribe((text) => {
      this.sequenceAlignment = new SequenceAlignment(text, 'fasta')
    })

  }


  searchAndHighlight() {
    // compensate with potential gaps in the sequence by adding gaps to the search term
    const searchTerm = this.form.value.searchTerm;
    if (searchTerm) {
      let newSearchTerm = '';
      for (let i = 0; i < searchTerm.length; i++) {
        newSearchTerm += searchTerm[i].toUpperCase();
        if (this.form.value.gap) {
          if (i !== searchTerm.length - 1) {
            newSearchTerm += '\-*';
          }
        }

      }
      const regex = new RegExp(newSearchTerm, 'ig');
      console.log(regex)
      // find the matching sections in all sequences and add them to the highlightSectionsMap
      for (let i = 0; i < this.sequenceAlignment!.alignmentIDs.length; i++) {
        const seq = this.sequenceAlignment!.alignmentMap.get(this.sequenceAlignment!.alignmentIDs[i]);
        if (seq) {
          const matches = [...seq.matchAll(regex)];
          console.log(matches)
          this.highlightSectionsMap[this.sequenceAlignment!.alignmentIDs[i]] = matches.map((match) => {
            return {start: match.index!, end: match.index! + match[0].length}
          })
        }
      }
    }
  }

  extractSegment() {
    if (this.formExtract.value.start && this.formExtract.value.end) {
      if (this.formExtract.value.start > this.formExtract.value.end) {
        return
      }
      this.extractedSegments.push({start: this.formExtract.value.start, end: this.formExtract.value.end})
    }

  }

}
