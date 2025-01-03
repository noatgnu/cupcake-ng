import {Component, Input, OnInit} from '@angular/core';
import {WebService} from "../web.service";
import {StorageObject, StorageObjectQuery} from "../storage-object";
import {NgbModal, NgbPagination, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {
  StorageObjectCreatorModalComponent
} from "./storage-object-creator-modal/storage-object-creator-modal.component";
import {StorageObjectViewComponent} from "./storage-object-view/storage-object-view.component";
import {Location} from "@angular/common";
import {MetadataNotificationModalComponent} from "./metadata-notification-modal/metadata-notification-modal.component";

@Component({
  selector: 'app-reagent-store',
  standalone: true,
  imports: [
    NgbPagination,
    StorageObjectViewComponent,
    NgbTooltip
  ],
  templateUrl: './reagent-store.component.html',
  styleUrl: './reagent-store.component.scss'
})
export class ReagentStoreComponent implements OnInit{
  search?: string
  private _storageID?: number|undefined;
  private _storedReagentID?: number|undefined;
  sidePanel: boolean = true

  @Input() set storageID(value: number|undefined) {
    this._storageID = value;
    if (value) {
      this.web.getStorageObject(value).subscribe((data) => {
        this.selectedStorageObject = data
        this.getStorageObjects(undefined, this.pageSize, 0, this.search, false, this.selectedStorageObject.id)
      })
    } else {
      this.getStorageObjects(undefined, this.pageSize, 0, this.search, true)
    }
  }

  get storageID(): number|undefined {
    return this._storageID;
  }

  get storedReagentID(): number|undefined {
    return this._storedReagentID;
  }
  @Input() set storedReagentID(value: number|undefined) {
    this._storedReagentID = value
  }

  rootStorageObjects?: StorageObjectQuery
  selectedStorageObject?: StorageObject|undefined

  pageSize = 10
  currentPage = 1
  currentPageOffset = 0


  constructor(private web: WebService, private modal: NgbModal, private location: Location) {

  }

  getStorageObjects(url?: string, limit: number = 10, offset: number = 0, search?: string, root: boolean = true, stored_at?: number) {
    console.log(url, limit, offset, search, root, stored_at)
    this.web.getStorageObjects(url, limit, offset, search, root, stored_at).subscribe((data) => {
      this.rootStorageObjects = data
    })
  }

  clickStorage(storageObject: StorageObject) {
    this.selectedStorageObject = storageObject
    this.getStorageObjects(undefined, this.pageSize, 0, undefined, false, storageObject.id)
  }

  openStorageObjectCreator() {
    const ref = this.modal.open(StorageObjectCreatorModalComponent, {scrollable: true})
    ref.componentInstance.stored_at = this.selectedStorageObject
    ref.closed.subscribe((data) => {
      this.web.createStorageObject(data.name, data.description, data.type, data.stored_at).subscribe((data) => {
        this.selectedStorageObject = data
        this.getStorageObjects(undefined, this.pageSize, 0, this.search, false, data.id)
      })
    })
  }

  handlePageChange(event: number) {
    const offset = (event - 1) * this.pageSize;
    this.currentPageOffset = offset;
    if (this.selectedStorageObject) {
      this.getStorageObjects(undefined, this.pageSize, offset, this.search, false, this.selectedStorageObject.id)
    } else {
      this.getStorageObjects(undefined, this.pageSize, offset, this.search, true)
    }
  }

  goBack() {
    if (this.selectedStorageObject) {
      if (this.selectedStorageObject.stored_at) {
        this.getStorageObjects(undefined, this.pageSize, 0, this.search, false, this.selectedStorageObject.stored_at)
        this.web.getStorageObject(this.selectedStorageObject.stored_at).subscribe((data) => {
          this.selectedStorageObject = data

        })
      } else {
        this.selectedStorageObject = undefined
        this.getStorageObjects(undefined, this.pageSize, this.currentPageOffset, this.search, true)
      }
    }
  }

  ngOnInit() {
    const metadata = localStorage.getItem('metadata-cupcake-reagent');
    if (metadata) {
      const ref = this.modal.open(MetadataNotificationModalComponent);
      ref.closed.subscribe((data) => {
        localStorage.removeItem('metadata-cupcake-reagent')
      })
    }
  }
}
