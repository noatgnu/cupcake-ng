import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedDocumentService } from '../shared-document.service';
import { DocumentCreateFolderRequest } from '../shared-document';
import { ToastService } from '../../toast.service';

@Component({
  selector: 'app-create-folder-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './create-folder-modal.component.html',
  styleUrl: './create-folder-modal.component.scss'
})
export class CreateFolderModalComponent {
  @Input() parentFolderId: number | null = null;
  @Input() currentPath: string = 'Root';

  folderName = '';
  creating = false;
  error: string | null = null;

  constructor(
    private activeModal: NgbActiveModal,
    private sharedDocumentService: SharedDocumentService,
    private toastService: ToastService
  ) {}

  close(): void {
    this.activeModal.dismiss();
  }

  async createFolder(): Promise<void> {
    if (!this.folderName.trim()) {
      this.error = 'Folder name is required';
      return;
    }

    this.creating = true;
    this.error = null;

    const request: DocumentCreateFolderRequest = {
      folder_name: this.folderName.trim(),
      is_shared_document_folder: true
    };

    if (this.parentFolderId !== null) {
      request.parent_folder = this.parentFolderId;
    }

    try {
      const result = await this.sharedDocumentService.createFolder(request).toPromise();
      this.toastService.show('Success', `Folder "${this.folderName}" created successfully`, 3000, 'success');
      this.activeModal.close(result);
    } catch (error: any) {
      console.error('Error creating folder:', error);
      this.toastService.show('Error', "Failed to create folder", 5000, 'danger');
    } finally {
      this.creating = false;
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.creating) {
      this.createFolder();
    }
  }
}
