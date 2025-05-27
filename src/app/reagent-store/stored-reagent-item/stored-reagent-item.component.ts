import {Component, EventEmitter, Input, Output} from '@angular/core';
import {StoredReagent} from "../../storage-object";
import {WebService} from "../../web.service";
import {AccountsService} from "../../accounts/accounts.service";
import {
  StoredReagentActivityCalendarComponent
} from "./stored-reagent-activity-calendar/stored-reagent-activity-calendar.component";
import {NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {ToastService} from "../../toast.service";
import {DatePipe, NgClass} from "@angular/common";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-stored-reagent-item',
  imports: [
    StoredReagentActivityCalendarComponent,
    NgbTooltip,
    DatePipe,
    NgClass,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgbDropdown
  ],
    templateUrl: './stored-reagent-item.component.html',
    styleUrl: './stored-reagent-item.component.scss'
})
export class StoredReagentItemComponent {
  @Input() permission: {view: boolean, edit: boolean, delete: boolean, use:boolean} = {view: false, edit: false, delete: false, use: false}
  private _storedReagent: StoredReagent|undefined = undefined
  @Input() set storedReagent(value: StoredReagent|undefined) {
    this._storedReagent = value
    if (value) {
      this.isSubscribed = value.is_subscribed
      if (value.subscription) {
        this.subscribedToExpiration = value.subscription.notify_on_expiry
        this.subscribedToLowStock = value.subscription.notify_on_low_stock
      }
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
  @Output() openStoredReagentSubscriptionModal: EventEmitter<boolean> = new EventEmitter<boolean>()
  @Output() openStoredReagentDocumentModal: EventEmitter<string> = new EventEmitter<string>();

  pathToRoot: {id: number, name: string}[] = []

  detailsOpen: boolean = false

  subscribedToLowStock: boolean = false;
  subscribedToExpiration: boolean = false;
  isSubscribed: boolean = false;
  documentCategories = [
    { id: 'MSDS', name: 'MSDS' },
    { id: 'Certificates', name: 'Certificates' },
    { id: 'Manuals', name: 'Manuals' }
  ];

  constructor(private web: WebService, public accounts: AccountsService, private toast: ToastService, private modal: NgbModal) {

  }

  copyDirectLinkToClipboard() {
    if (this.storedReagent) {
      const url = `${window.location.origin}/#/reagent-store/${this.storedReagent.storage_object.id}/${this.storedReagent.id}`
      navigator.clipboard.writeText(url).then(() => {
        this.toast.show("Storage Reagent", "Direct link copied to clipboard", 2000, "success")
      })
    }
  }

  getSubscriptionTooltip(): string {
    if (!this.isSubscribed) {
      return 'Subscribe to notifications';
    }

    let tooltip = 'Subscribed to: ';
    let notifications = [];

    if (this.subscribedToLowStock) {
      notifications.push('Low Stock');
    }
    if (this.subscribedToExpiration) {
      notifications.push('Expiration');
    }

    return tooltip + notifications.join(', ');
  }

  getSubscriptionBadgeText(): string {
    if (this.subscribedToLowStock && this.subscribedToExpiration) {
      return 'All';
    } else if (this.subscribedToLowStock) {
      return 'Low Stock';
    } else if (this.subscribedToExpiration) {
      return 'Expiry';
    }
    return '';
  }

}
