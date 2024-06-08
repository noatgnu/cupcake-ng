import {Component, EventEmitter, Input, Output} from '@angular/core';
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
import {StoredReagentItemComponent} from "../stored-reagent-item/stored-reagent-item.component";
import {StoredReagentEditorModalComponent} from "../stored-reagent-editor-modal/stored-reagent-editor-modal.component";
import {HttpErrorResponse} from "@angular/common/http";
import {ToastService} from "../../toast.service";
import {StorageObjectEditorModalComponent} from "../storage-object-editor-modal/storage-object-editor-modal.component";
import {CameraModalComponent} from "../../camera-modal/camera-modal.component";
import {QrcodeModalComponent} from "../../qrcode-modal/qrcode-modal.component";
import {BarcodeScannerModalComponent} from "../../barcode-scanner-modal/barcode-scanner-modal.component";
import {ActionLogsModalComponent} from "../action-logs-modal/action-logs-modal.component";
import {ReserveActionModalComponent} from "../reserve-action-modal/reserve-action-modal.component";

@Component({
  selector: 'app-storage-object-view',
  standalone: true,
  imports: [
    NgbPagination,
    ReactiveFormsModule,
    StoredReagentItemComponent,
    BarcodeScannerModalComponent
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
    } else {
      this.pathToRoot = []
    }
  }

  @Output() toggleSidePanel: EventEmitter<boolean> = new EventEmitter<boolean>()

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

  constructor(private web: WebService, private fb: FormBuilder, private modal: NgbModal, private toastService: ToastService) {
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
      this.web.createStoredReagent(data.stored_object, data.name,data.unit, data.quantity, data.notes, data.barcode).subscribe((data) => {
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
    const ref = this.modal.open(StoredReagentEditorModalComponent, {scrollable: true})
    ref.componentInstance.storedReagent = reagent
    ref.closed.subscribe((data) => {
      this.web.updateStoredReagent(reagent.id, data.quantity, data.notes).subscribe((data) => {
        this.getStoredReagents(undefined, this.pageSize, this.currentPageOffset, undefined, this.storageObject?.id)
      })
    })
  }

  deleteStorageObject() {
    const ref = this.modal.open(AreYouSureModalComponent)
    ref.closed.subscribe((data) => {
      this.web.deleteStorageObject(this.storageObject!.id).subscribe((data) => {

      }, (error: HttpErrorResponse) => {
        // check if error code is 409
        if (error.status === 409) {
          alert("Cannot delete storage object with stored reagents from other users")
        }
      })
    })
  }

  openStorageObjectEditorModal() {
    const ref = this.modal.open(StorageObjectEditorModalComponent, {scrollable: true})
    ref.componentInstance.storageObject = this.storageObject
    ref.closed.subscribe((data) => {
      this.web.updateStorageObject(this.storageObject!.id, data.name, data.description).subscribe((data) => {
        this.storageObject = data
      })
    })
  }

  openCameraModal() {
    const ref = this.modal.open(CameraModalComponent, {scrollable: true})
    ref.closed.subscribe((data) => {
      if (data.remove) {
        this.web.updateStorageObject(this.storageObject!.id, this.storageObject!.object_name, this.storageObject!.object_description, undefined).subscribe((data) => {
          this.storageObject = data
        })
      } else {
        this.web.updateStorageObject(this.storageObject!.id, this.storageObject!.object_name, this.storageObject!.object_description, data).subscribe((data) => {
          this.storageObject = data
        })
      }

    })
  }

  openReagentCameraModal(reagent: StoredReagent) {
    const ref = this.modal.open(CameraModalComponent, {scrollable: true})
    ref.closed.subscribe((data) => {
      if (data.remove) {
        this.web.updateStoredReagent(reagent.id, reagent.quantity, reagent.notes, undefined).subscribe((data) => {
          this.getStoredReagents(undefined, this.pageSize, this.currentPageOffset, undefined, this.storageObject?.id)
        })
      } else {
        this.web.updateStoredReagent(reagent.id, reagent.quantity, reagent.notes, data).subscribe((data) => {
          this.getStoredReagents(undefined, this.pageSize, this.currentPageOffset, undefined, this.storageObject?.id)
        })
      }

    })
  }

  openQRCodeModal() {
    const ref = this.modal.open(QrcodeModalComponent, {scrollable: true})
    ref.componentInstance.url = location.origin + "/#/reagent-store/" + this.storageObject?.id
  }

  openBarcodeScannerModal() {
    const ref = this.modal.open(BarcodeScannerModalComponent, {scrollable: true})
    ref.componentInstance.enableSearch = true
    ref.componentInstance.storageObject = this.storageObject
    ref.closed.subscribe((data) => {
      this.form.controls.name.setValue(data.barcode)
      //this.getStoredReagents(undefined, this.pageSize, this.currentPageOffset, data.barcode, this.storageObject?.id)
    })
  }

  openBarcodeScannerReagent(reagent: StoredReagent) {
    const ref = this.modal.open(BarcodeScannerModalComponent)
    ref.closed.subscribe((data) => {
      this.web.updateStoredReagent(reagent.id, reagent.quantity, reagent.notes, reagent.png_base64, data.barcode).subscribe((sr) => {
        this.storedReagentQuery!.results = this.storedReagentQuery!.results.map((r) => {
          if (r.id === reagent.id) {
            return sr
          } else {
            return r
          }
        })
      })
    })
  }

  openCloningReagentModal(reagent: StoredReagent) {
    const ref = this.modal.open(StoredReagentCreatorModalComponent, {scrollable: true})
    ref.componentInstance.stored_at = this.storageObject
    ref.componentInstance.storedReagent = reagent
    ref.closed.subscribe((data) => {
      this.web.createStoredReagent(data.stored_object, data.name, data.unit, data.quantity, data.notes, data.barcode).subscribe((data) => {
        this.getStoredReagents(undefined, this.pageSize, this.currentPageOffset, undefined, this.storageObject?.id)
      })
    })
  }

  openActionLogsModal(reagent: StoredReagent) {
    const ref = this.modal.open(ActionLogsModalComponent, {scrollable: true})
    ref.componentInstance.storedReagent = reagent
  }

  openReserveActionModal(reagent: StoredReagent) {
    const ref = this.modal.open(ReserveActionModalComponent)
    ref.componentInstance.storedReagent = reagent
    ref.closed.subscribe((data) => {
      this.web.createStoredReagentAction(reagent.id, "reserve", data.quantity).subscribe((data) => {
        this.web.getStoredReagent(reagent.id).subscribe((data) => {
          this.storedReagentQuery!.results = this.storedReagentQuery!.results.map((r) => {
            if (r.id === reagent.id) {
              return data
            } else {
              return r
            }
          })
        })
      })
    })
  }

  openAddActionModal(reagent: StoredReagent) {
    const ref = this.modal.open(ReserveActionModalComponent)
    ref.componentInstance.storedReagent = reagent
    ref.closed.subscribe((data) => {
      this.web.createStoredReagentAction(reagent.id, "add", data.quantity).subscribe((data) => {
        this.web.getStoredReagent(reagent.id).subscribe((data) => {
          this.storedReagentQuery!.results = this.storedReagentQuery!.results.map((r) => {
            if (r.id === reagent.id) {
              return data
            } else {
              return r
            }
          })
        })
      })
    })
  }
}
