import {Component, Input} from '@angular/core';
import {StoredReagent} from "../../storage-object";
import {WebService} from "../../web.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-reserve-action-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './reserve-action-modal.component.html',
  styleUrl: './reserve-action-modal.component.scss'
})
export class ReserveActionModalComponent {
  private _storedReagent: StoredReagent|undefined = undefined
  @Input() set storedReagent(value: StoredReagent|undefined) {
    this._storedReagent = value

  }

  get storedReagent(): StoredReagent|undefined {
    return this._storedReagent!
  }

  form = this.fb.group({
    quantity: 0,
    notes: '',
  })


  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder) {
  }

  close() {
    this.activeModal.dismiss()
  }

  submit() {
    this.activeModal.close(this.form.value)
  }

}
