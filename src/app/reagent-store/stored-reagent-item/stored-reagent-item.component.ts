import {Component, EventEmitter, Input, Output} from '@angular/core';
import {StoredReagent} from "../../storage-object";
import {WebService} from "../../web.service";
import {AccountsService} from "../../accounts/accounts.service";
import {
  StoredReagentActivityCalendarComponent
} from "./stored-reagent-activity-calendar/stored-reagent-activity-calendar.component";
import {NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute} from "@angular/router";
import {ToastService} from "../../toast.service";
import {DatePipe} from "@angular/common";

@Component({
    selector: 'app-stored-reagent-item',
    imports: [
        StoredReagentActivityCalendarComponent,
        NgbTooltip,
        DatePipe
    ],
    templateUrl: './stored-reagent-item.component.html',
    styleUrl: './stored-reagent-item.component.scss'
})
export class StoredReagentItemComponent {
  @Input() permission: {view: boolean, edit: boolean, delete: boolean} = {view: false, edit: false, delete: false}
  private _storedReagent: StoredReagent|undefined = undefined
  @Input() set storedReagent(value: StoredReagent|undefined) {
    this._storedReagent = value
    if (value) {
      this.web.getStorageObjectPathToRoot(value.storage_object.id).subscribe((data) => {
        this.pathToRoot = data
      })
      if (value.expiration_date) {
        const now = new Date()
        const expirationDate = new Date(value.expiration_date)
        const diff = expirationDate.getTime() - now.getTime()
        this.daysToExpire = Math.ceil(diff / (1000 * 3600 * 24))
      }
    }
  }

  get storedReagent(): StoredReagent|undefined {
    return this._storedReagent!
  }

  daysToExpire: number = 0

  @Output() delete: EventEmitter<boolean> = new EventEmitter<boolean>()
  @Output() openStoredReagentEditorModal: EventEmitter<boolean> = new EventEmitter<boolean>()
  @Output() openCameraModal: EventEmitter<boolean> = new EventEmitter<boolean>()
  @Output() openQrScannerModal: EventEmitter<boolean> = new EventEmitter<boolean>()
  @Output() openCloneStoredReagentModal: EventEmitter<boolean> = new EventEmitter<boolean>()
  @Output() openActionLogsModal: EventEmitter<boolean> = new EventEmitter<boolean>()
  @Output() openReserveActionModal: EventEmitter<boolean> = new EventEmitter<boolean>()
  @Output() openAddActionModal: EventEmitter<boolean> = new EventEmitter<boolean>()
  @Output() openStoredReagentAccessControlModal: EventEmitter<boolean> = new EventEmitter<boolean>()
  pathToRoot: {id: number, name: string}[] = []

  detailsOpen: boolean = false
  constructor(private web: WebService, public accounts: AccountsService, private toast: ToastService) {

  }

  copyDirectLinkToClipboard() {
    if (this.storedReagent) {
      const url = `${window.location.origin}/#/reagent-store/${this.storedReagent.storage_object.id}/${this.storedReagent.id}`
      navigator.clipboard.writeText(url).then(() => {
        this.toast.show("Storage Reagent", "Direct link copied to clipboard", 2000, "success")
      })
    }
  }


}
