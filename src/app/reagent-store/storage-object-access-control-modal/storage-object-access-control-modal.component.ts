import {Component, Input} from '@angular/core';
import {NgbActiveModal, NgbPagination, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {StorageObject} from "../../storage-object";
import {WebService} from "../../web.service";
import {LabGroup, LabGroupQuery} from "../../lab-group";
import {FormBuilder, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {AccountsService} from "../../accounts/accounts.service";

@Component({
  selector: 'app-storage-object-access-control-modal',
  standalone: true,
  imports: [
    FormsModule,
    NgbPagination,
    NgbTooltip,
    ReactiveFormsModule
  ],
  templateUrl: './storage-object-access-control-modal.component.html',
  styleUrl: './storage-object-access-control-modal.component.scss'
})
export class StorageObjectAccessControlModalComponent {
  private _data: StorageObject|undefined
  @Input() set data(value: StorageObject) {
    this._data = value
    this.searchLabGroupsByStorageObject()
    this.searchLabGroups()

  }

  get data(): StorageObject|undefined {
    return this._data
  }

  labGroupPage: number = 0
  labGroupQuery: LabGroupQuery|undefined
  currentLabGroupQuery: LabGroupQuery|undefined
  currentLabGroupSize: number = 10
  currentLabGroupByStorageObjectPage: number = 0
  form = this.fb.group({
    name: "",
  })

  inThisStorageObjectMap: {[key: number]: boolean} = {}

  constructor(private modal: NgbActiveModal, private web: WebService, private fb: FormBuilder, private accounts: AccountsService) {

  }

  searchLabGroups() {
    if (this.data) {
      if (this.accounts.is_staff) {
        //@ts-ignore
        this.web.getLabGroups(this.form.value.name, this.currentLabGroupSize, (this.labGroupPage-1)*this.currentLabGroupSize).subscribe((labGroupQuery) => {
          this.labGroupQuery = labGroupQuery
        })
      } else {
        this.web.getUserLabGroups().subscribe((labGroupQuery) => {
          this.labGroupQuery = labGroupQuery
        })
      }
    }
  }

  onLabGroupPageChange(page: number) {
    this.labGroupPage = page
    this.searchLabGroups()
  }

  onLabGroupByStorageObjectPageChange(page: number) {
    this.currentLabGroupByStorageObjectPage = page
    this.searchLabGroupsByStorageObject()
  }

  searchLabGroupsByStorageObject() {
    if (this.data) {
      this.web.getLabGroupsByStorageObject(this.data.id, this.currentLabGroupSize, (this.labGroupPage-1)*this.currentLabGroupSize).subscribe((labGroupQuery) => {
        this.currentLabGroupQuery = labGroupQuery
        this.inThisStorageObjectMap = {}
        for (const labGroup of labGroupQuery.results) {
          this.inThisStorageObjectMap[labGroup.id] = true
        }
        this.currentLabGroupQuery = labGroupQuery
      })
    }
  }

  close() {
    this.modal.close()
  }

  removeFromLabGroup(labGroup: LabGroup) {
    if (this.data) {
      this.web.removeLabGroupFromStorageObject(this.data.id, labGroup.id).subscribe(() => {
        this.searchLabGroupsByStorageObject()
        this.searchLabGroups()
      })
    }
  }

  addToLabGroup(labGroup: LabGroup) {
    if (this.data) {
      this.web.addLabGroupToStorageObject(this.data.id, labGroup.id).subscribe(() => {
        this.searchLabGroupsByStorageObject()
        this.searchLabGroups()
      })
    }
  }
}
