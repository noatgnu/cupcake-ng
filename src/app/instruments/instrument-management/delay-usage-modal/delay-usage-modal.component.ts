import { Component } from '@angular/core';
import {NgbActiveModal, NgbDateStruct, NgbInputDatepicker} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-delay-usage-modal',
  imports: [
    NgbInputDatepicker,
    FormsModule
  ],
  templateUrl: './delay-usage-modal.component.html',
  styleUrl: './delay-usage-modal.component.scss'
})
export class DelayUsageModalComponent {
  model: NgbDateStruct|undefined = undefined;
  delay_days: number|undefined = undefined;

  constructor(private modal: NgbActiveModal) {
  }

  close() {
    this.modal.dismiss();
  }

  save() {
    if (this.model && this.delay_days) {
      const date = new Date(this.model.year, this.model.month - 1, this.model.day);
      this.modal.close({start_date: date, days: this.delay_days});
    }
  }

}
