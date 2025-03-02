import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {StorageObject} from "../../storage-object";

@Component({
    selector: 'app-storage-object-creator-modal',
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './storage-object-creator-modal.component.html',
    styleUrl: './storage-object-creator-modal.component.scss'
})
export class StorageObjectCreatorModalComponent {
  private _stored_at: StorageObject|null = null

  @Input() set stored_at(value: StorageObject|null) {
    this._stored_at = value
    if (value) {
      this.form.controls.stored_at.setValue(value.id)
    }
  }

  get stored_at():StorageObject|null {
    return this._stored_at
  }

  form = this.fb.group({
    name: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    stored_at: new FormControl<number|null>(null),
    type: new FormControl('shelf', Validators.required),
  })

  typeChoices = [
    "shelf", "box", "fridge", "freezer", "room", "building", "floor", "other"
  ]

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
