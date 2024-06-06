import {Component, Input} from '@angular/core';
import {StorageObject, StoredReagent, StoredReagentQuery} from "../../storage-object";
import {WebService} from "../../web.service";
import {NgbModal, NgbPagination} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {
  StorageObjectCreatorModalComponent
} from "../storage-object-creator-modal/storage-object-creator-modal.component";
import {
  StoredReagentCreatorModalComponent
} from "../stored-reagent-creator-modal/stored-reagent-creator-modal.component";
import {AreYouSureModalComponent} from "../../are-you-sure-modal/are-you-sure-modal.component";

@Component({
  selector: 'app-storage-object-view',
  standalone: true,
  imports: [
    NgbPagination,
    ReactiveFormsModule
  ],
  templateUrl: './storage-object-view.component.html',
  styleUrl: './storage-object-view.component.scss'
})
export class StorageObjectViewComponent {

  private _storageObject?: StorageObject|undefined

  @Input() set storageObject(value: StorageObject|undefined) {
    this._storageObject = value
    console.log(value)
    this.storedReagentQuery = undefined
    console.log(this.storedReagentQuery)
    if (value) {
      this.getStoredReagents(undefined, this.pageSize, this.currentPageOffset, undefined, value.id)
      this.web.getStorageObjectPathToRoot(value.id).subscribe((data) => {
        this.pathToRoot = data
      })
    }
  }

  get storageObject(): StorageObject|undefined {
    return this._storageObject
  }

  pathToRoot: {id: number, name: string}[] = []

  storedReagentQuery?: StoredReagentQuery

  currentPage = 1
  pageSize = 10
  currentPageOffset = 0

  form = this.fb.group({
    name: new FormControl("", Validators.required),
  })

  constructor(private web: WebService, private fb: FormBuilder, private modal: NgbModal) {
    this.form.controls.name.valueChanges.subscribe((value) => {
      if (value) {
        this.getStoredReagents(undefined, this.pageSize, this.currentPageOffset, value, this.storageObject?.id)
      }
    })

  }

  getStoredReagents(url?: string, limit: number = 10, offset : number = 0, search?: string, storage_object?: number) {
    console.log(storage_object)
    this.web.getStoredReagents(url, limit, offset, search, storage_object).subscribe((data) => {
      this.storedReagentQuery = data
      console.log(data)
    })
  }

  handlePageChange(event: number) {
    this.currentPage = event
    this.currentPageOffset = (event - 1) * this.pageSize
    if (this.form.value.name) {
      this.getStoredReagents(undefined, this.pageSize, this.currentPageOffset, this.form.value.name, this.storageObject?.id)
    } else {
      this.getStoredReagents(undefined, this.pageSize, this.currentPageOffset, undefined, this.storageObject?.id)
    }
  }

  openStoredReagentCreatorModal() {
    const ref = this.modal.open(StoredReagentCreatorModalComponent, {scrollable: true})
    ref.componentInstance.stored_at = this.storageObject
    ref.closed.subscribe((data) => {
      this.web.createStoredReagent(data.stored_object, data.name,data.unit, data.quantity, data.notes).subscribe((data) => {
        this.getStoredReagents(undefined, this.pageSize, this.currentPageOffset, undefined, this.storageObject?.id)
      })
    })
  }

  delete(reagent: StoredReagent) {
    const ref = this.modal.open(AreYouSureModalComponent)
    ref.closed.subscribe((data) => {
      this.web.deleteStoredReagent(reagent.id).subscribe((data) => {
        this.getStoredReagents(undefined, this.pageSize, this.currentPageOffset, undefined, this.storageObject?.id)
      })
    })
  }

  openStoredReagentEditorModal(reagent: StoredReagent) {

  }
}
