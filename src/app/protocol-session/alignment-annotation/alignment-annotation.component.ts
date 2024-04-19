import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {SequenceAlignment} from "../../sequence-alignment";
import {Annotation} from "../../annotation";
import {WebService} from "../../web.service";
import {FormBuilder, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {AlignmentSegmentComponent} from "./alignment-segment/alignment-segment.component";
import {DataService} from "../../data.service";
import {ToastService} from "../../toast.service";

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

  editMode = false

  data: {
    extractedSegments: {start: number, end: number, dataURL?: string}[],
    highlightSectionsMap: {[key: string]: {start: number, end: number}[]},
    cellWidth: number,
    cellHeight: number,
    cellOffset: number,
    alignmentFormat: string,
    sequenceType: string,
    dataURL?: string,
    threeFrameHighlight?: {[key: string]: {[key: string]: {start: number, end: number}[]}},
  } = {
    extractedSegments: [],
    highlightSectionsMap: {},
    cellWidth: 20,
    cellHeight: 20,
    cellOffset: 5,
    alignmentFormat: 'fasta',
    sequenceType: 'amino-acid',
    threeFrameHighlight: {}
  }

  @Input() set annotation(value: Annotation) {
    if (value.annotation !== "") {
      this.data = JSON.parse(value.annotation)
    }
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

  constructor(private web: WebService, private fb: FormBuilder, private toast: ToastService, private dataService: DataService) {

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
      // @ts-ignore
      this.sequenceAlignment = new SequenceAlignment(text, 'fasta', this.data.sequenceType)
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
          if (!this.data.highlightSectionsMap[this.sequenceAlignment!.alignmentIDs[i]]) {
            this.data.highlightSectionsMap[this.sequenceAlignment!.alignmentIDs[i]] = []
          }
          for (const m of matches) {
            this.data.highlightSectionsMap[this.sequenceAlignment!.alignmentIDs[i]].push({start: m.index!, end: m.index! + m[0].length})
          }
        }
      }
      if (this.sequenceAlignment?.sequenceType === 'nucleotide' && this.sequenceAlignment.threeFrame) {
        if (!this.data.threeFrameHighlight) {
          this.data.threeFrameHighlight = {}
        }
        for (const frame of Object.keys(this.sequenceAlignment.threeFrame)) {
          if (!this.data.threeFrameHighlight[frame]) {
            this.data.threeFrameHighlight[frame] = {}
          }
          for (let i = 0; i < this.sequenceAlignment.alignmentIDs.length; i++) {
            const seq = this.sequenceAlignment.threeFrame[frame][this.sequenceAlignment.alignmentIDs[i]]
            if (seq) {
              const matches = [...seq.map((x) => {return x.residue}).join('').matchAll(regex)];
              if (!this.data.threeFrameHighlight[frame][this.sequenceAlignment!.alignmentIDs[i]]) {
                this.data.threeFrameHighlight[frame][this.sequenceAlignment!.alignmentIDs[i]] = []
              }
              for (const m of matches) {
                this.data.threeFrameHighlight[frame][this.sequenceAlignment!.alignmentIDs[i]].push({start: m.index!, end: m.index! + m[0].length})
              }
            }
          }
        }
      }

      this.dataService.redrawSubject.next(true)
    }
  }

  extractSegment() {
    if (this.formExtract.value.start && this.formExtract.value.end) {
      if (this.formExtract.value.start > this.formExtract.value.end) {
        return
      }
      this.data.extractedSegments.push({start: this.formExtract.value.start, end: this.formExtract.value.end})

    }
  }

  save() {
    this.toast.show('Annotation', 'Saving annotation')
    this.web.updateAnnotation(JSON.stringify(this.data), this.annotation.annotation_type, this.annotation.id).subscribe((response) => {
      console.log(response)
      this.toast.show('Annotation', 'Annotation saved')
    })
  }

  update() {
    if (this.sequenceAlignment) {
      if (!this.sequenceAlignment.threeFrame && this.sequenceAlignment.sequenceType === 'nucleotide') {
        this.sequenceAlignment.threeFrameTranslationAll()
      }
    }
    this.dataService.redrawSubject.next(true)
  }

}
