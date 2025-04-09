import {Component, Input} from '@angular/core';
import {DatePipe} from "@angular/common";
import {Annotation} from "../../annotation";
import {NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {AnnotationService} from "../../annotation.service";
import {DataService} from "../../data.service";

@Component({
  selector: 'app-annotation-file',
  imports: [
    DatePipe,
    NgbTooltip
  ],
  templateUrl: './annotation-file.component.html',
  styleUrl: './annotation-file.component.scss'
})
export class AnnotationFileComponent {
  private _annotation: Annotation|undefined;
  @Input() set annotation(annotation: Annotation) {
    this._annotation = annotation;
  }
  get annotation(): Annotation|undefined {
    return this._annotation;
  }

  @Input() enableMetadata: boolean = false;
  @Input() enableScratch: boolean = false;

  constructor(public annotationService: AnnotationService, public dataService: DataService) {

  }

  deleteAnnotation() {
    if (this.annotation) {
      this.annotationService.deleteAnnotation(this.annotation.id)
    }
  }

}
