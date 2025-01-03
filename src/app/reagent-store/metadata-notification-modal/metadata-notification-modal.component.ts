import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-metadata-notification-modal',
  standalone: true,
  imports: [],
  templateUrl: './metadata-notification-modal.component.html',
  styleUrl: './metadata-notification-modal.component.scss'
})
export class MetadataNotificationModalComponent {
  constructor(private modal: NgbActiveModal) {
  }

  close() {
    this.modal.dismiss()
  }

  clearMetadata() {
    this.modal.close()
  }
}
