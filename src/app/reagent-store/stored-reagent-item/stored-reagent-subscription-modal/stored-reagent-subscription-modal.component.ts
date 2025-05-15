import { Component, Input } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";
import {StoredReagent} from "../../../storage-object";
import {DatePipe} from "@angular/common";

@Component({
  selector: 'app-stored-reagent-subscription-modal',
  imports: [
    FormsModule,
    DatePipe
  ],
  templateUrl: './stored-reagent-subscription-modal.component.html',
  styleUrl: './stored-reagent-subscription-modal.component.scss'
})
export class StoredReagentSubscriptionModalComponent {
  @Input() subscribeToLowStock: boolean = false;
  @Input() subscribeToExpiry: boolean = false;
  @Input() reagent?: StoredReagent;
  constructor(public modal: NgbActiveModal) {
  }

  dismiss() {
    this.modal.dismiss();
  }

  submit() {
    this.modal.close({
      subscribeToLowStock: this.subscribeToLowStock,
      subscribeToExpiry: this.subscribeToExpiry
    });
  }

  unsubscribeAll() {
    this.subscribeToLowStock = false;
    this.subscribeToExpiry = false;
    this.modal.close({
      subscribeToLowStock: this.subscribeToLowStock,
      subscribeToExpiry: this.subscribeToExpiry
    });
  }

}
