import {Component, Input} from '@angular/core';
import {ProtocolStepReagent} from "../../reagent";
import {StoredReagent, StoredReagentQuery} from "../../storage-object";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {NgbActiveModal, NgbPagination} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../web.service";
import {DatePipe, NgClass} from "@angular/common";

@Component({
    selector: 'app-reagent-stock-search-modal',
    imports: [
        ReactiveFormsModule,
        NgbPagination,
        NgClass,
    ],
    templateUrl: './reagent-stock-search-modal.component.html',
    styleUrl: './reagent-stock-search-modal.component.scss'
})
export class ReagentStockSearchModalComponent {

  selectedReagent: StoredReagent|undefined = undefined
  selectedReagentPath: {id: number, name: string}[] = []

  private _reagent: ProtocolStepReagent|undefined = undefined

  @Input() set reagent(value: ProtocolStepReagent) {
    this._reagent = value
    this.form.controls.searchTerm.setValue(value.reagent.name)
    this.form.controls.quantity.setValue(value.quantity)
    this.searchReagent()
  }

  get reagent(): ProtocolStepReagent {
    return this._reagent!
  }

  storedReagentQuery?: StoredReagentQuery | undefined

  form = this.fb.group({
    searchTerm: [''],
    userOwnedOnly: [false],
    storageObjectName: [''],
    quantity: [0]
  })

  currentPage: number = 1
  pageSize: number = 10


  constructor(private fb: FormBuilder, private activeModal: NgbActiveModal, private web: WebService) {
  }

  searchReagent() {
    // @ts-ignore
    this.web.getStoredReagents(undefined, this.pageSize, 0, this.form.value.searchTerm, null, this.form.value.storageObjectName, this.form.value.userOwnedOnly).subscribe((data) => {
      this.storedReagentQuery = data

    })

  }

  close() {
    this.activeModal.dismiss()
  }

  accept() {
    this.activeModal.close({reagent: this.selectedReagent, quantity: this.form.value.quantity})
  }

  handlePageChange(event: number) {
    const offset = (event - 1) * this.pageSize
    this.currentPage = event
    this.searchReagent()
  }

  clickReagent(reagent: StoredReagent) {
    if (this.selectedReagent === reagent) {
      this.selectedReagent = undefined
      this.selectedReagentPath = []
    }
    this.web.getStorageObjectPathToRoot(reagent.storage_object.id).subscribe((data) => {
      this.selectedReagentPath = data
      this.selectedReagent = reagent
    })


  }

}
