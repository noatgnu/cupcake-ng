import {Component, Input} from '@angular/core';
import {Annotation} from "../../annotation";
import {WebService} from "../../web.service";
import {HandwrittenAnnotationComponent} from "../handwritten-annotation/handwritten-annotation.component";

@Component({
  selector: 'app-sketch-presenter',
  standalone: true,
  imports: [
    HandwrittenAnnotationComponent
  ],
  templateUrl: './sketch-presenter.component.html',
  styleUrl: './sketch-presenter.component.scss'
})
export class SketchPresenterComponent {
  _annotation?: Annotation;
  data?: any;
  @Input() set annotation(value: Annotation) {
    this._annotation = value;
    if (value.file) {
      this.web.getAnnotationFile(value.id).subscribe((data: any) => {
        this.data = data
        console.log(this.data);
      })

    }
  }
  get annotation(): Annotation|undefined {
    return this._annotation;
  }

  constructor(private web: WebService) { }
}
