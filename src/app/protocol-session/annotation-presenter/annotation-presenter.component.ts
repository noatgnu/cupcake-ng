import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Annotation, AnnotationQuery} from "../../annotation";
import {AsyncPipe, DatePipe, NgOptimizedImage} from "@angular/common";
import {SketchPresenterComponent} from "../sketch-presenter/sketch-presenter.component";
import {ImagePresenterComponent} from "../image-presenter/image-presenter.component";
import {MediaPresenterComponent} from "../media-presenter/media-presenter.component";
import {WebService} from "../../web.service";

@Component({
  selector: 'app-annotation-presenter',
  standalone: true,
  imports: [
    DatePipe,
    NgOptimizedImage,
    SketchPresenterComponent,
    AsyncPipe,
    ImagePresenterComponent,
    MediaPresenterComponent
  ],
  templateUrl: './annotation-presenter.component.html',
  styleUrl: './annotation-presenter.component.scss'
})
export class AnnotationPresenterComponent {
  @Input() annotations: Annotation[] = [];
  @Output() deleteAnnotation: EventEmitter<number> = new EventEmitter<number>();

  constructor(private web: WebService) { }

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

}
