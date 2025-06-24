import {Component, Input} from '@angular/core';
import {DatePipe} from "@angular/common";
import {Annotation} from "../../annotation";
import {NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {AnnotationService} from "../../annotation.service";
import {DataService} from "../../data.service";
import {WebService} from "../../web.service";

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

  constructor(public annotationService: AnnotationService, public dataService: DataService, private webService: WebService) {

  }

  deleteAnnotation() {
    if (this.annotation) {
      this.annotationService.deleteAnnotation(this.annotation.id)
    }
  }

  isPdfFile(): boolean {
    if (!this.annotation?.file) return false;
    const fileUrl = this.annotation.file.toString();
    return fileUrl.toLowerCase().endsWith('.pdf');
  }

  viewPdf() {
    if (this.annotation) {
      this.webService.getSignedURL(this.annotation.id).subscribe((token: any) => {
        const viewUrl = `${this.webService.baseURL}/api/annotation/download_signed/?token=${token["signed_token"]}&?view=inline`;
        window.open(viewUrl, '_blank');
      });
    }
  }

}
