import {Component, Input} from '@angular/core';
import {StoredReagent} from "../../storage-object";
import {FormBuilder, FormControl, ReactiveFormsModule} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-stored-reagent-editor-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './stored-reagent-editor-modal.component.html',
  styleUrl: './stored-reagent-editor-modal.component.scss'
})
export class StoredReagentEditorModalComponent {
  private _storedReagent: StoredReagent|undefined = undefined

  @Input() set storedReagent(value: StoredReagent|undefined) {
    this._storedReagent = value
    if (value) {
      this.form.controls.quantity.setValue(value.quantity)
      this.form.controls.notes.setValue(value.notes)
    }
  }

  get storedReagent(): StoredReagent|undefined {
    return this._storedReagent
  }

  form = this.fb.group({
    quantity: new FormControl(0),
    notes: new FormControl(''),
  })

  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder) {
  }

  close() {
    this.activeModal.dismiss()
  }

  submit() {
    if (this.form.valid) {
      this.activeModal.close(this.form.value)
    }
  }
}
