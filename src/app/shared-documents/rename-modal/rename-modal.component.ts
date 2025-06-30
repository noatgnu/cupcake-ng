import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SharedDocumentService} from "../shared-document.service";
import {DocumentRenameRequest} from "../shared-document";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-rename-modal',
  imports: [
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './rename-modal.component.html',
  styleUrl: './rename-modal.component.scss'
})
export class RenameModalComponent {
  @Input() currentName: string = '';
  @Input() isFolder: boolean = false;
  @Input() documentId: number = 0;
  newName: string = '';
  error: string = '';
  renaming: boolean = false;

  constructor(private dialog: NgbActiveModal, private sharedDocumentService: SharedDocumentService) { }

  renameDocument() {
    this.renaming = false;
    if (this.newName.trim() === '') {
      this.error = 'Name cannot be empty.';
      return;
    }
    if (this.newName.trim() === this.currentName) {
      this.error = 'New name cannot be the same as the current name.';
      return;
    }
    const renameRequest: DocumentRenameRequest = {
      annotation_id: null,
      folder_id: null,
      annotation_name: null,
      folder_name: null
    }
    if (this.isFolder) {
      renameRequest.folder_id = this.documentId;
      renameRequest.folder_name = this.newName;
    } else {
      renameRequest.annotation_id = this.documentId;
      renameRequest.annotation_name = this.newName;
    }
    this.sharedDocumentService.rename(renameRequest).subscribe({
      next: () => {
        this.renaming = true;
        this.dialog.close(this.newName);
      },
      error: (error: any) => {
        this.renaming = false;
        this.error = 'Error renaming document: ' + error.message;
      }
    })
  }

  close() {
    this.dialog.dismiss()
  }

  save() {
    this.renameDocument();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.renaming) {
      this.renameDocument();
    }
  }

}
