import {Component, Input} from '@angular/core';
import {NgbActiveModal, NgbPagination, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {LabGroup} from "../../../lab-group";
import {WebService} from "../../../web.service";
import {StorageObject, StorageObjectQuery} from "../../../storage-object";

@Component({
    selector: 'app-edit-lab-group-modal',
    imports: [
        ReactiveFormsModule,
        NgbPagination,
        NgbTooltip
    ],
    templateUrl: './edit-lab-group-modal.component.html',
    styleUrl: './edit-lab-group-modal.component.scss'
})
export class EditLabGroupModalComponent {
  private _labGroup: LabGroup | undefined
  @Input() set labGroup(value: LabGroup) {
    this._labGroup = value
    //@ts-ignore
    this.form.patchValue({name: value.name, description: value.description, is_professional: value.is_professional})
    if (value.default_storage) {
      //@ts-ignore
      this.form.patchValue({default_storage_id: value.default_storage.id})
    }
    if (value.service_storage) {
      //@ts-ignore
      this.form.patchValue({service_storage_id: value.service_storage.id})
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
    search_storage_name: [''],
    service_storage_id: [''],
    is_professional: [false]
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
      this.modal.close({id: this.labGroup.id, name: this.form.value.name, description: this.form.value.description, default_storage_id: this.form.value.default_storage_id, service_storage_id: this.form.value.service_storage_id, is_professional: this.form.value.is_professional})
    } else {
      this.modal.close({name: this.form.value.name, description: this.form.value.description, default_storage_id: this.form.value.default_storage_id, service_storage_id: this.form.value.service_storage_id, is_professional: this.form.value.is_professional})
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
    this.form.patchValue({default_storage_id: storageObject.id})
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

  assignServiceStorage(storageObject: StorageObject) {
    //@ts-ignore
    this.form.patchValue({service_storage_id: storageObject.id})
    if (this.labGroup) {
      this.labGroup.service_storage = storageObject
    }
  }

  removeServiceStorage() {
    //@ts-ignore
    this.form.patchValue({service_storage_id: ''})
    if (this.labGroup) {
      this.labGroup.service_storage = null
    }
  }
}
