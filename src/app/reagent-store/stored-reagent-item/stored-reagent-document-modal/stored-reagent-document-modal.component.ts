import { Component, Input, OnInit } from '@angular/core';
import {NgbActiveModal, NgbModal, NgbPagination} from '@ng-bootstrap/ng-bootstrap';
import {ToastService} from "../../../toast.service";
import {WebService} from "../../../web.service";
import {StoredReagent} from "../../../storage-object";
import {UploadLargeFileModalComponent} from "../../../upload-large-file-modal/upload-large-file-modal.component";
import { firstValueFrom } from 'rxjs';
import {DatePipe} from "@angular/common";
import {Annotation} from "../../../annotation";
import {AccountsService} from "../../../accounts/accounts.service";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
@Component({
  selector: 'app-stored-reagent-document-modal',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    NgbPagination
  ],
  templateUrl: './stored-reagent-document-modal.component.html',
  styleUrl: './stored-reagent-document-modal.component.scss'
})
export class StoredReagentDocumentModalComponent implements OnInit {
  @Input() storedReagent!: StoredReagent;
  @Input() folderName: string = 'all';

  documents: Annotation[] = [];
  isLoading = false;
  totalDocuments = 0;
  pageSize = 10;
  currentPage = 1;

  form = this.fb.group({
    searchTerm: ['']
  });

  constructor(
    private modal: NgbModal,
    private activeModal: NgbActiveModal,
    private web: WebService,
    private toast: ToastService,
    public accounts: AccountsService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(offset = 0): void {
    if (!this.storedReagent) return;

    this.isLoading = true;
    this.web.getReagentDocuments(this.storedReagent.id, this.folderName, this.pageSize, offset, this.form.value.searchTerm)
      .subscribe({
        next: (response) => {
          this.documents = response.results;
          this.totalDocuments = response.count;
          this.isLoading = false;
        },
        error: (error) => {
          this.toast.show("Error", "Failed to load documents", 3000, "danger");
          this.isLoading = false;
        }
      });
  }

  openUploadModal(): void {
    const modalRef = this.modal.open(UploadLargeFileModalComponent, { size: 'lg' });
    modalRef.componentInstance.stored_reagent_id = this.storedReagent.id;
    modalRef.componentInstance.folder_name = this.folderName;

    modalRef.closed.subscribe((result) => {
      if (result) {
        this.refreshDocuments();
      }
    });
  }

  async downloadDocument(doc: Annotation): Promise<void> {
    try {
      const response = await firstValueFrom(this.web.getReagentDocumentDownloadToken(doc.id));

      if (response) {
        const url = this.web.baseURL + "/api/reagent_documents/download_signed/?token=" + response.token;
        console.log(url);
        const link = document.createElement('a');
        link.href = url;
        link.click();
        link.target = '_blank';
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      this.toast.show("Error", "Failed to download document", 3000, "danger");
    }
  }

  async deleteDocument(doc: Annotation): Promise<void> {
    if (confirm(`Are you sure you want to delete "${doc.annotation_name}"?`)) {
      try {
        await firstValueFrom(this.web.deleteReagentDocument(doc.id));
        this.toast.show("Success", "Document deleted successfully", 2000, "success");
        this.loadDocuments(); // Refresh list
      } catch (error) {
        this.toast.show("Error", "Failed to delete document", 3000, "danger");
      }
    }
  }

  close(): void {
    this.activeModal.dismiss();
  }

  getFileIcon(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();

    if (['pdf'].includes(extension || '')) return 'bi-file-earmark-pdf';
    if (['doc', 'docx'].includes(extension || '')) return 'bi-file-earmark-word';
    if (['xls', 'xlsx'].includes(extension || '')) return 'bi-file-earmark-excel';
    if (['png', 'jpg', 'jpeg', 'gif'].includes(extension || '')) return 'bi-file-earmark-image';
    return 'bi-file-earmark';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  handlePageChange(page: number): void {
    this.currentPage = page;
    this.loadDocuments((page - 1) * this.pageSize);
  }

  refreshDocuments(): void {
    this.loadDocuments((this.currentPage - 1) * this.pageSize);
  }
}
