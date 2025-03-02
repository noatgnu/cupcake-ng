import {Component, EventEmitter, Input, Output} from '@angular/core';
import {WebService} from "../../web.service";
import {AnnotationFolder} from "../../annotation";
import {DatePipe} from "@angular/common";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {FolderNameModalComponent} from "./folder-name-modal/folder-name-modal.component";
import {DeleteFolderModalComponent} from "./delete-folder-modal/delete-folder-modal.component";

@Component({
    selector: 'app-folder-list',
    imports: [
        DatePipe
    ],
    templateUrl: './folder-list.component.html',
    styleUrl: './folder-list.component.scss'
})
export class FolderListComponent {
  private _sessionID?: string
  editMode: boolean = false
  @Input() set sessionID(value: string) {
    this._sessionID = value
    if (!value) {
      return
    }
    this.web.sessionGetBaseFolders(value).subscribe((data) => {
      this.folderList = data
    })
  }
  folderList: AnnotationFolder[] = []

  selectedFolder?: AnnotationFolder
  parentFolder?: AnnotationFolder

  @Output() selectedFolderChange: EventEmitter<AnnotationFolder> = new EventEmitter<AnnotationFolder>()
  get sessionID(): string {
    return this._sessionID!
  }

  constructor(private web: WebService, private modal: NgbModal) {

  }

  createFolder() {
    const ref = this.modal.open(FolderNameModalComponent)
    ref.closed.subscribe((name) => {
      if (name) {
        this.web.sessionAddFolder(this.sessionID, name).subscribe((data) => {
          this.folderList.push(data)
        })
      }
    })
  }

  handleFolderSelect(folder: AnnotationFolder) {
    if (this.editMode) {
      return
    }

    if (Object.keys(folder).length > 0 ) {
      this.parentFolder = Object.assign({}, this.selectedFolder)
      this.selectedFolder = folder
      this.web.getFolderChildren(folder.id).subscribe((data) => {
        this.folderList = data
      })
      this.selectedFolderChange.emit(folder)
    } else {
      this.selectedFolder = this.parentFolder
      this.parentFolder = undefined
      this.web.sessionGetBaseFolders(this.sessionID).subscribe((data) => {
        this.folderList = data
      })
    }
  }

  deleteFolder(folder: AnnotationFolder) {
    const ref = this.modal.open(DeleteFolderModalComponent)
    ref.closed.subscribe((removeContent) => {
      this.web.sessionRemoveFolder(this.sessionID, folder.id, removeContent).subscribe(() => {
        this.folderList = this.folderList.filter((f) => f.id !== folder.id)
      })
    })
  }


}
