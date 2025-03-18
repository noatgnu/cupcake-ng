import {Component, Input} from '@angular/core';
import {NgbActiveModal, NgbAlert} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-sdrf-validation-results-modal',
  imports: [
    NgbAlert
  ],
  templateUrl: './sdrf-validation-results-modal.component.html',
  styleUrl: './sdrf-validation-results-modal.component.scss'
})
export class SdrfValidationResultsModalComponent {
  @Input() errors: string[] = []
  constructor(private modal: NgbActiveModal) { }

  close() {
    this.modal.dismiss()
  }

}
