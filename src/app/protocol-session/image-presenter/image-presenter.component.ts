import {Component, Input} from '@angular/core';
import {Annotation} from "../../annotation";
import {WebService} from "../../web.service";
import {AsyncPipe} from "@angular/common";

@Component({
    selector: 'app-image-presenter',
    imports: [
        AsyncPipe
    ],
    templateUrl: './image-presenter.component.html',
    styleUrl: './image-presenter.component.scss'
})
export class ImagePresenterComponent {
  _annotation?: Annotation;
  image: string = '';
  @Input() set annotation(value: Annotation) {
    this._annotation = value;
    if (value.file) {
      /*this.web.getAnnotationImageBlobUrl(value.id).subscribe((url) => {
        this.image = url;
      })*/
      this.web.getSignedURL(value.id).subscribe((token: any) => {
        this.image = `${this.web.baseURL}/api/annotation/download_signed/?token=${token["signed_token"]}`
      })
    }

  }

  get annotation(): Annotation {
    return this._annotation!;
  }

  constructor(private web: WebService) {

  }

}
