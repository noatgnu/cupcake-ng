import {Component, Input} from '@angular/core';
import {Annotation} from "../../annotation";
import {WebService} from "../../web.service";
import {AsyncPipe} from "@angular/common";

@Component({
  selector: 'app-image-presenter',
  standalone: true,
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
      this.web.getAnnotationImageBlobUrl(value.id).subscribe((url) => {
        this.image = url;
      })
    }

  }

  get annotation(): Annotation {
    return this._annotation!;
  }

  constructor(private web: WebService) {

  }

}
