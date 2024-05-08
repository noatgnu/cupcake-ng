import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Annotation, AnnotationQuery} from "../../annotation";
import {AsyncPipe, DatePipe, NgOptimizedImage} from "@angular/common";
import {SketchPresenterComponent} from "../sketch-presenter/sketch-presenter.component";
import {ImagePresenterComponent} from "../image-presenter/image-presenter.component";
import {MediaPresenterComponent} from "../media-presenter/media-presenter.component";
import {WebService} from "../../web.service";
import {NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbModal, NgbModalConfig} from "@ng-bootstrap/ng-bootstrap";
import {TranscribeModalComponent} from "../transcribe-modal/transcribe-modal.component";
import {ChecklistPresenterComponent} from "../checklist-presenter/checklist-presenter.component";
import {CounterPresenterComponent} from "../counter-presenter/counter-presenter.component";
import {TablePresenterComponent} from "../table-presenter/table-presenter.component";
import {AlignmentAnnotationComponent} from "../alignment-annotation/alignment-annotation.component";
import {CalculatorAnnotationComponent} from "../calculator-annotation/calculator-annotation.component";
import {MolarityCalculatorComponent} from "../molarity-calculator/molarity-calculator.component";
import {AnnotationRenameModalComponent} from "./annotation-rename-modal/annotation-rename-modal.component";
import {RandomizationPresenterComponent} from "../randomization-presenter/randomization-presenter.component";

@Component({
  selector: 'app-annotation-presenter',
  standalone: true,
  imports: [
    DatePipe,
    NgOptimizedImage,
    SketchPresenterComponent,
    AsyncPipe,
    ImagePresenterComponent,
    MediaPresenterComponent,
    ChecklistPresenterComponent,
    CounterPresenterComponent,
    TablePresenterComponent,
    AlignmentAnnotationComponent,
    CalculatorAnnotationComponent,
    MolarityCalculatorComponent,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    RandomizationPresenterComponent
  ],
  templateUrl: './annotation-presenter.component.html',
  styleUrl: './annotation-presenter.component.scss'
})
export class AnnotationPresenterComponent {
  private _annotations?: Annotation[]
  @Input() set annotations(value: Annotation[]) {
    this._annotations = value
    this.web.checkAnnotationPermissions(value.map((a) => a.id)).subscribe((response) => {
      console.log(response)
    })
  }
  get annotations(): Annotation[] {
    return this._annotations!
  }
  @Output() deleteAnnotation: EventEmitter<number> = new EventEmitter<number>();



  constructor(private web: WebService, private modal: NgbModal, private modalConfig: NgbModalConfig) {
    this.modalConfig.backdrop = 'static';
    this.modalConfig.keyboard = false;
  }

  delete(annotationID: number) {
    this.deleteAnnotation.emit(annotationID);
  }

  download(annotationID: number) {
    this.web.getSignedURL(annotationID).subscribe((token: any) => {
      const a = document.createElement('a');
      a.href = `${this.web.baseURL}/api/annotation/download_signed/?token=${token["signed_token"]}`;
      a.download = 'download';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    })
  }

  openTranscribeModal(annotation: Annotation) {
    const ref = this.modal.open(TranscribeModalComponent)
    ref.componentInstance.annotation = annotation
    ref.closed.subscribe((result: any) => {
      if (result["language"]) {
        this.web.postTranscribeRequest(annotation.id, result["language"], result["model"]).subscribe((response: any) => {

        })
      }
    })
  }

  ocrAnnotation(annotation: Annotation) {
    this.web.sketchOCR(annotation.id).subscribe((response: any) => {
      console.log(response)
    })
  }

  scratch(annotation: Annotation) {
    this.web.scratchAnnotation(annotation.id).subscribe((response: Annotation) => {
      annotation.scratched = response.scratched
    })
  }

  updateAnnotation(annotation: Annotation) {
    this.annotations = this.annotations.map((a) => {
      if (a.id === annotation.id) {
        return annotation
      }
      return a
    })
  }

  annotationRename(annotation: Annotation) {
    const ref = this.modal.open(AnnotationRenameModalComponent)
    ref.componentInstance.annotation = annotation
    ref.closed.subscribe((result: string) => {
      if (result) {
        this.web.annotationRename(annotation.id, result).subscribe((response: Annotation) => {
          annotation.annotation_name = response.annotation_name
        })
      }
    })
  }
}
