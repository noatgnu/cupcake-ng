import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-removal-are-you-sure',
  standalone: true,
  imports: [],
  templateUrl: './removal-are-you-sure.component.html',
  styleUrl: './removal-are-you-sure.component.scss'
})
export class RemovalAreYouSureComponent {

    constructor(private activeModal: NgbActiveModal) {

    }

    ok() {
      this.activeModal.close(true)
    }

    cancel() {
      this.activeModal.dismiss()
    }
}
