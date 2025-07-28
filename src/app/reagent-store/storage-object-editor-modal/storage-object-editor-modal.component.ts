import {Component, Input} from '@angular/core';
import {StorageObject} from "../../storage-object";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {WebService} from "../../web.service";
import {ToastService} from "../../toast.service";

@Component({
    selector: 'app-storage-object-editor-modal',
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

  vaultToggleLoading: boolean = false;

  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder, private web: WebService, private toast: ToastService) {
  }

  submit() {
    if (this.form.valid) {
      this.activeModal.close(this.form.value)
    }
  }

  close() {
    this.activeModal.dismiss()
  }

  toggleVault() {
    if (!this.storageObject?.id) return;
    
    this.vaultToggleLoading = true;
    this.web.unvaultStorageObject(this.storageObject.id).subscribe({
      next: (response) => {
        this.toast.show("Storage Object", response.message || "Storage object unvaulted successfully");
        if (this.storageObject) {
          this.storageObject.is_vaulted = false;
        }
        this.vaultToggleLoading = false;
      },
      error: (error) => {
        console.error('Error unvaulting storage object:', error);
        this.toast.show("Error", error.error?.error || "Failed to unvault storage object");
        this.vaultToggleLoading = false;
      }
    });
  }

}
