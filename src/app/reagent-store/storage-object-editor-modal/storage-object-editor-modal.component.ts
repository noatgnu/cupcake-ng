import {Component, Input} from '@angular/core';
import {StorageObject} from "../../storage-object";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";

@Component({
  selector: 'app-storage-object-editor-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './storage-object-editor-modal.component.html',
  styleUrl: './storage-object-editor-modal.component.scss'
})
export class StorageObjectEditorModalComponent {
  private _storageObject?: StorageObject|undefined = undefined

  @Input() set storageObject(value: StorageObject|undefined) {
    this._storageObject = value
    if (value) {
      this.form.controls.object_description.setValue(value.object_description)
      this.form.controls.object_name.setValue(value.object_name)
    }
  }

  get storageObject(): StorageObject|undefined {
    return this._storageObject
  }

  form = this.fb.group({
    object_name: new FormControl("", Validators.required),
    object_description: new FormControl("")
  })

  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder) {
  }

  submit() {
    if (this.form.valid) {
      this.activeModal.close(this.form.value)
    }
  }

  close() {
    this.activeModal.dismiss()
  }

}
