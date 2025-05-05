import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {NgStyle} from "@angular/common";

@Component({
  selector: 'app-image-viewer-modal',
  imports: [
    NgStyle
  ],
  templateUrl: './image-viewer-modal.component.html',
  styleUrl: './image-viewer-modal.component.scss'
})
export class ImageViewerModalComponent {
  @Input() imageSrc: string = '';
  @Input() title: string = 'Instrument Image';

  constructor(private activeModal: NgbActiveModal) {}

  close(): void {
    this.activeModal.dismiss();
  }

}
