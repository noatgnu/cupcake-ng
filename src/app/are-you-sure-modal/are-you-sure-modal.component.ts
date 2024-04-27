import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-are-you-sure-modal',
  standalone: true,
  imports: [],
  templateUrl: './are-you-sure-modal.component.html',
  styleUrl: './are-you-sure-modal.component.scss'
})
export class AreYouSureModalComponent {

  constructor(private activeModal: NgbActiveModal) {
  }

  close() {
    this.activeModal.dismiss()
  }

  ok() {
    this.activeModal.close()
  }
}
