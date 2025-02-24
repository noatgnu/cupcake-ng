import {Component, Input} from '@angular/core';
import {NgbActiveModal, NgbPagination} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {LabGroup} from "../../../lab-group";
import {WebService} from "../../../web.service";
import {StorageObject, StorageObjectQuery} from "../../../storage-object";

@Component({
  selector: 'app-edit-lab-group-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgbPagination
  ],
  templateUrl: './edit-lab-group-modal.component.html',
  styleUrl: './edit-lab-group-modal.component.scss'
})
export class EditLabGroupModalComponent {
  private _labGroup: LabGroup | undefined
  @Input() set labGroup(value: LabGroup) {
    this._labGroup = value
    //@ts-ignore
    this.form.patchValue({name: value.name, description: value.description})
    if (value.default_storage) {
      //@ts-ignore
      this.form.patchValue({default_storage_id: value.default_storage.id, search_storage_name: value.default_storage.object_name})
    }
    this.web.getStorageObjectsByLabGroup(value.id, this.storageObjectPageSize, 0).subscribe((data) => {
      this.storageObjectQuery = data
    })
  }

  get labGroup() {
    return this._labGroup!
  }

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    default_storage_id: [''],
    search_storage_name: ['']
  })
  currentStorageObjectPage = 0
  storageObjectPageSize = 10
  storageObjectQuery: StorageObjectQuery|undefined
  constructor(private modal: NgbActiveModal, private fb: FormBuilder, private web: WebService) {
    this.form.controls.search_storage_name.valueChanges.subscribe((value) => {
      if (value && this.labGroup) {
        this.web.getStorageObjectsByLabGroup(this.labGroup.id, this.storageObjectPageSize, (this.currentStorageObjectPage-1)*this.storageObjectPageSize, value).subscribe((data) => {
          this.storageObjectQuery = data
        })
      }
    })
  }

  close() {
    this.modal.dismiss()
  }

  submit() {
    if (this.labGroup) {
      this.modal.close({id: this.labGroup.id, name: this.form.value.name, description: this.form.value.description})
    } else {
      this.modal.close({name: this.form.value.name, description: this.form.value.description})
    }
  }

  onGetStorageObjectPageChange(page: number) {
    this.currentStorageObjectPage = page
    if (this.labGroup) {
      //@ts-ignore
      this.web.getStorageObjectsByLabGroup(this.labGroup.id, this.storageObjectPageSize, (this.currentStorageObjectPage-1)*this.storageObjectPageSize, this.form.value.search_storage_name).subscribe((data) => {
        this.storageObjectQuery = data
      })
    }
  }

  assignDefaultStorageObject(storageObject: StorageObject) {
    //@ts-ignore
    this.form.patchValue({default_storage_id: storageObject.id, search_storage_name: storageObject.object_name})
    if (this.labGroup) {
      this.labGroup.default_storage = storageObject
    }
  }

  removeDefaultStorage() {
    //@ts-ignore
    this.form.patchValue({default_storage_id: '', search_storage_name: ''})
    if (this.labGroup) {
      this.labGroup.default_storage = null
      this.web.getStorageObjectsByLabGroup(this.labGroup.id, this.storageObjectPageSize, (this.currentStorageObjectPage-1)*this.storageObjectPageSize).subscribe((data) => {
        this.storageObjectQuery = data
      })
    }
  }
}
