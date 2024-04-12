import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Annotation, AnnotationQuery} from "../../annotation";
import {AsyncPipe, DatePipe, NgOptimizedImage} from "@angular/common";
import {SketchPresenterComponent} from "../sketch-presenter/sketch-presenter.component";
import {ImagePresenterComponent} from "../image-presenter/image-presenter.component";
import {MediaPresenterComponent} from "../media-presenter/media-presenter.component";
import {WebService} from "../../web.service";
import {NgbModal, NgbModalConfig} from "@ng-bootstrap/ng-bootstrap";
import {TranscribeModalComponent} from "../transcribe-modal/transcribe-modal.component";
import {ChecklistPresenterComponent} from "../checklist-presenter/checklist-presenter.component";
import {CounterPresenterComponent} from "../counter-presenter/counter-presenter.component";
import {TablePresenterComponent} from "../table-presenter/table-presenter.component";

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
    TablePresenterComponent
  ],
  templateUrl: './annotation-presenter.component.html',
  styleUrl: './annotation-presenter.component.scss'
})
export class AnnotationPresenterComponent {
  @Input() annotations: Annotation[] = [];
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
}
