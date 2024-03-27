import {Component, Input} from '@angular/core';
import {Annotation} from "../../annotation";
import {WebService} from "../../web.service";

@Component({
  selector: 'app-media-presenter',
  standalone: true,
  imports: [],
  templateUrl: './media-presenter.component.html',
  styleUrl: './media-presenter.component.scss'
})
export class MediaPresenterComponent {
  _annotation?: Annotation;
  mediaURL: string = ''
  @Input() set annotation(value: Annotation) {
    this._annotation = value
    this.web.getAnnotationImageBlobUrl(value.id).subscribe((url) => {
      this.mediaURL = url
    })
  }

  get annotation(): Annotation {
    return this._annotation!
  }
  constructor(private web: WebService) { }

}
