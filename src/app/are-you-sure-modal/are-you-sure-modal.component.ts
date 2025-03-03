import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-are-you-sure-modal',
    imports: [],
    templateUrl: './are-you-sure-modal.component.html',
    styleUrl: './are-you-sure-modal.component.scss'
})
export class AreYouSureModalComponent {
  @Input() message: string = ""

  constructor(private activeModal: NgbActiveModal) {
  }

  close() {
    this.activeModal.dismiss()
  }

  ok() {
    this.activeModal.close()
  }
}
