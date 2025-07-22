import {Component, Input} from '@angular/core';
import {Annotation} from "../../annotation";
import {WebService} from "../../web.service";
import {HandwrittenAnnotationComponent} from "../handwritten-annotation/handwritten-annotation.component";
import {NgbNav, NgbNavContent, NgbNavItem, NgbNavLinkButton, NgbNavOutlet} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-sketch-presenter',
    imports: [
        HandwrittenAnnotationComponent,
        NgbNav,
        NgbNavContent,
        NgbNavLinkButton,
        NgbNavItem,
        NgbNavOutlet
    ],
    templateUrl: './sketch-presenter.component.html',
    styleUrl: './sketch-presenter.component.scss'
})
export class SketchPresenterComponent {
  _annotation?: Annotation;
  data?: any;
  transcription?: string;
  active = 'OCR'
  @Input() set annotation(value: Annotation) {
    this._annotation = value;
    if (value.transcribed) {
      this.transcription = value.transcription
    }
    if (value.file) {
      this.web.getSignedURL(value.id).subscribe({
        next: (token: any) => {
          const fileUrl = `${this.web.baseURL}/api/annotation/download_signed/?token=${token["signed_token"]}`;
          console.log('Generated signed URL for sketch:', fileUrl);
          
          // Fetch the JSON data using the signed URL
          fetch(fileUrl)
            .then(response => response.json())
            .then(data => {
              this.data = data;
              console.log('Sketch data loaded:', this.data);
            })
            .catch(error => {
              console.error('Error loading sketch data:', error);
              this.data = null;
            });
        },
        error: (error: any) => {
          console.error('Error getting signed URL:', error);
          this.data = null;
        }
      });
    }
  }
  get annotation(): Annotation|undefined {
    return this._annotation;
  }

  constructor(private web: WebService) { }
}
