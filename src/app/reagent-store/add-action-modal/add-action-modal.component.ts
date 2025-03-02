import {Component, Input} from '@angular/core';
import {StoredReagent} from "../../storage-object";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";

@Component({
    selector: 'app-add-action-modal',
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './add-action-modal.component.html',
    styleUrl: './add-action-modal.component.scss'
})
export class AddActionModalComponent {
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
