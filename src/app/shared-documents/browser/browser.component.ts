import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import {NgbModal, NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem} from '@ng-bootstrap/ng-bootstrap';
import { SharedDocumentService } from '../shared-document.service';
import { DocumentBrowseResponse, SharedDocument, DocumentBreadcrumb, SharedFolder } from '../shared-document';
import { SiteSettingsService } from '../../site-settings.service';
import { CreateFolderModalComponent } from '../create-folder-modal/create-folder-modal.component';
import { UploadFileModalComponent } from '../upload-file-modal/upload-file-modal.component';
import { ShareModalComponent } from '../share-modal/share-modal.component';
import { environment } from '../../../environments/environment';
import {RenameModalComponent} from "../rename-modal/rename-modal.component";

@Component({
  selector: 'app-browser',
  imports: [CommonModule, FormsModule, NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem],
  templateUrl: './browser.component.html',
  styleUrl: './browser.component.scss'
})
export class BrowserComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Filter and view state
  selectedFilter: 'all' | 'personal' | 'shared' = 'all';
  viewMode: 'card' | 'list' = 'list';
  hideSection = false;
  loading = false;
  error: string | null = null;

  // Search functionality
  searchQuery = '';
  isSearching = false;

  // Browse data
  browseData: DocumentBrowseResponse | null = null;
  currentFolderId: number | null = null;

  // Pagination
  currentOffset = 0;
  readonly itemsPerPage = 50;

  constructor(
    private sharedDocumentService: SharedDocumentService,
    public siteSettings: SiteSettingsService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load documents based on current filter and folder
  loadDocuments(): void {
    this.loading = true;
    this.error = null;

    this.sharedDocumentService.browse(
      this.currentFolderId ?? undefined,
      this.selectedFilter,
      this.currentOffset,
      this.itemsPerPage
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.browseData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load documents. Please try again.';
        this.loading = false;
        console.error('Error loading documents:', err);
      }
    });
  }

  // Filter change handler
  onFilterChange(filter: 'all' | 'personal' | 'shared'): void {
    this.selectedFilter = filter;
    this.currentOffset = 0;
    this.loadDocuments();
  }

  // Navigate to folder
  navigateToFolder(folderId: number | null): void {
    this.currentFolderId = folderId;
    this.currentOffset = 0;
    this.loadDocuments();
  }

  // Breadcrumb navigation
  navigateToBreadcrumb(breadcrumb: DocumentBreadcrumb): void {
    this.navigateToFolder(breadcrumb.id);
  }

  // Go to parent folder
  goToParent(): void {
    if (this.browseData?.current_folder?.parent_id !== undefined) {
      this.navigateToFolder(this.browseData.current_folder.parent_id);
    } else {
      this.navigateToFolder(null); // Go to root
    }
  }

  downloadDocument(sharedDocument: SharedDocument): void {
    if (!sharedDocument.user_permissions?.can_download) {
      return;
    }

    this.sharedDocumentService.getSignedUrl(sharedDocument.id).subscribe({
      next: (response) => {
        const apiUrl = `${environment.baseURL}/api/shared_documents`;
        const downloadUrl = `${apiUrl}/download_signed/?token=${response.signed_token}`;

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = sharedDocument.annotation_name || 'download';
        link.target = '_blank';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      error: (err) => {
        console.error('Download failed:', err);
        this.error = 'Failed to download document.';
      }
    });
  }

  // Get file icon
  getFileIcon(document: SharedDocument): string {
    return this.sharedDocumentService.getFileIcon(document);
  }

  // Get folder icon
  getFolderIcon(folder: SharedFolder): string {
    return this.sharedDocumentService.getFolderIcon(folder);
  }

  // Format file size
  formatFileSize(input: number | SharedDocument | null): string {
    return this.sharedDocumentService.formatFileSize(input);
  }

  // Check if user has permission on document
  hasPermission(document: SharedDocument, permission: keyof NonNullable<SharedDocument['user_permissions']>): boolean {
    return this.sharedDocumentService.hasPermission(document, permission);
  }

  // Check if user has permission on folder
  hasFolderPermission(folder: SharedFolder, permission: keyof SharedFolder['user_permissions']): boolean {
    return this.sharedDocumentService.hasFolderPermission(folder, permission);
  }

  // Get filter display name
  getFilterDisplayName(): string {
    switch (this.selectedFilter) {
      case 'personal': return 'Personal Documents';
      case 'shared': return 'Shared Documents';
      default: return 'All Documents';
    }
  }

  // Get filter icon
  getFilterIcon(): string {
    switch (this.selectedFilter) {
      case 'personal': return 'bi-person-fill';
      case 'shared': return 'bi-people-fill';
      default: return 'bi-files';
    }
  }

  // Check if has footer text
  hasFooterText(): boolean {
    const settings = this.siteSettings.getCurrentPublicSettings();
    return !!(settings?.footer_text && settings.footer_text.trim());
  }

  // Get current path display
  getCurrentPath(): string {
    if (!this.browseData?.breadcrumbs.length) {
      return 'Root';
    }
    return this.browseData.breadcrumbs.map(b => b.name).join(' / ');
  }

  isFolderShared(folder: SharedFolder): boolean {
    // If we're in shared filter, assume it's shared
    if (this.selectedFilter === 'shared') {
      return true;
    }
    // If is_owned is explicitly false, it's shared with the user
    if (folder.is_owned === false) {
      return true;
    }
    // Check if folder has sharing stats indicating it's shared
    if (folder.sharing_stats && folder.sharing_stats.total_shared > 0) {
      return true;
    }
    // If folder has permissions array with items, it's likely shared
    if (folder.permissions && folder.permissions.length > 0) {
      return true;
    }
    // If user is not the owner, it's shared with them
    if (!folder.user_permissions.is_owner) {
      return true;
    }
    return false;
  }

  isFolderOwned(folder: SharedFolder): boolean {
    // Check if is_owned is explicitly true
    if (folder.is_owned === true) {
      return true;
    }
    // Fallback to user_permissions.is_owner
    if (folder.user_permissions.is_owner) {
      return true;
    }
    return false;
  }

  openCreateFolderModal(): void {
    const modalRef = this.modalService.open(CreateFolderModalComponent, {
      size: 'md',
      backdrop: 'static'
    });

    modalRef.componentInstance.parentFolderId = this.currentFolderId;
    modalRef.componentInstance.currentPath = this.getCurrentPath();

    modalRef.result.then(
      (result) => {
        if (result) {
          // Refresh the current view
          this.loadDocuments();
        }
      },
      () => {
        // Modal dismissed, no action needed
      }
    );
  }

  // Open upload file modal
  openUploadFileModal(): void {
    const modalRef = this.modalService.open(UploadFileModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.parentFolderId = this.currentFolderId;
    modalRef.componentInstance.currentPath = this.getCurrentPath();

    modalRef.result.then(
      (result) => {
        if (result) {
          // Refresh the current view
          this.loadDocuments();
        }
      },
      () => {
        // Modal dismissed, no action needed
      }
    );
  }

  // Delete document
  deleteDocument(document: SharedDocument, event?: Event): void {
    if (event) {
      event.stopPropagation(); // Prevent folder navigation when clicking delete
    }

    if (!document.user_permissions?.can_delete) {
      this.error = 'You do not have permission to delete this document.';
      return;
    }

    const confirmMessage = `Are you sure you want to delete "${document.annotation_name}"? This action cannot be undone.`;

    if (confirm(confirmMessage)) {
      this.loading = true;
      this.error = null;

      this.sharedDocumentService.deleteDocument(document.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loading = false;
          // Refresh the current view
          this.loadDocuments();
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Failed to delete document. Please try again.';
          console.error('Error deleting document:', err);
        }
      });
    }
  }

  // Delete folder
  deleteFolder(folder: SharedFolder, event?: Event): void {
    if (event) {
      event.stopPropagation(); // Prevent folder navigation when clicking delete
    }

    if (!folder.user_permissions.can_delete) {
      this.error = 'You do not have permission to delete this folder.';
      return;
    }

    const hasItems = folder.document_count && folder.document_count > 0;
    let confirmMessage = `Are you sure you want to delete "${folder.name}"?`;

    if (hasItems) {
      confirmMessage += ` This folder contains ${folder.document_count} item(s) which will also be deleted.`;
    }

    confirmMessage += ' This action cannot be undone.';

    if (confirm(confirmMessage)) {
      this.loading = true;
      this.error = null;

      this.sharedDocumentService.deleteFolder(folder.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loading = false;
          // Refresh the current view
          this.loadDocuments();
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Failed to delete folder. Please try again.';
          console.error('Error deleting folder:', err);
        }
      });
    }
  }

  // Open share modal for document
  openShareDocumentModal(document: SharedDocument, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const modalRef = this.modalService.open(ShareModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.item = document;
    modalRef.componentInstance.itemType = 'document';

    modalRef.result.then(
      (result) => {
        if (result) {
          // Refresh the current view
          this.loadDocuments();
        }
      },
      () => {
        // Modal dismissed, no action needed
      }
    );
  }

  // Open share modal for folder
  openShareFolderModal(folder: SharedFolder, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const modalRef = this.modalService.open(ShareModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.item = folder;
    modalRef.componentInstance.itemType = 'folder';

    modalRef.result.then(
      (result) => {
        if (result) {
          // Refresh the current view
          this.loadDocuments();
        }
      },
      () => {
        // Modal dismissed, no action needed
      }
    );
  }

  // Get folder sharing stats for display
  getFolderSharingInfo(folder: SharedFolder): string {
    if (!folder.sharing_stats || folder.sharing_stats.total_shared === 0) {
      return '';
    }

    const stats = folder.sharing_stats;
    const parts = [];

    if (stats.shared_users > 0) {
      parts.push(`${stats.shared_users} user${stats.shared_users > 1 ? 's' : ''}`);
    }

    if (stats.shared_groups > 0) {
      parts.push(`${stats.shared_groups} group${stats.shared_groups > 1 ? 's' : ''}`);
    }

    return parts.length > 0 ? `Shared with ${parts.join(' and ')}` : '';
  }

  // Check if user is folder owner
  isFolderOwner(folder: SharedFolder): boolean {
    if (!folder.user_permissions) {
      return false; // No permissions data available
    }
    return folder.user_permissions.is_owner;
  }

  // Toggle view mode
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'card' ? 'list' : 'card';
  }

  // Get view mode icon
  getViewModeIcon(): string {
    return this.viewMode === 'card' ? 'bi-list' : 'bi-grid-3x3-gap';
  }

  // Get view mode tooltip
  getViewModeTooltip(): string {
    return this.viewMode === 'card' ? 'Switch to List View' : 'Switch to Card View';
  }

  // Format date for list view
  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Get file extension
  getFileExtension(document: SharedDocument): string {
    return document.file_info?.extension || '';
  }

  // Get owner display name
  getOwnerDisplayName(item: SharedDocument | SharedFolder): string {
    // Check for folder owner property first
    if ('owner' in item && item.owner) {
      const owner = item.owner;
      if ('first_name' in owner && owner.first_name && owner.last_name) {
        return `${owner.first_name} ${owner.last_name}`.trim();
      }
      return owner.username;
    }
    
    // Check for document user property
    if ('user' in item && item.user && item.user.username) {
      return item.user.username;
    }
    
    // For shared documents, check the shared_by in permissions
    if ('document_permissions' in item && item.document_permissions?.length > 0) {
      const sharedBy = item.document_permissions[0].shared_by;
      if (sharedBy) {
        if (sharedBy.first_name && sharedBy.last_name) {
          return `${sharedBy.first_name} ${sharedBy.last_name}`.trim();
        }
        return sharedBy.username;
      }
    }
    
    return 'Unknown';
  }

  // Check if document is shared (similar to folder logic)
  isDocumentShared(document: SharedDocument): boolean {
    // If we're in shared filter, assume it's shared
    if (this.selectedFilter === 'shared') {
      return true;
    }
    // Check if is_shared property exists (from DocumentBrowseResponse extension)
    const extendedDocument = document as SharedDocument & { is_shared?: boolean; is_owned?: boolean };
    if (extendedDocument.is_shared === true) {
      return true;
    }
    // If is_owned is explicitly false, it's shared with the user
    if (extendedDocument.is_owned === false) {
      return true;
    }
    // Check if document has sharing stats indicating it's shared
    if (document.sharing_stats && document.sharing_stats.total_shared > 0) {
      return true;
    }
    // If document has permissions array with items, it's likely shared
    if (document.document_permissions && document.document_permissions.length > 0) {
      return true;
    }
    // If user is not the owner, it's shared with them
    if (document.user_permissions && !document.user_permissions.is_owner) {
      return true;
    }
    return false;
  }

  // Check if user owns the document
  isDocumentOwned(document: SharedDocument): boolean {
    // Check if is_owned is explicitly true (from DocumentBrowseResponse extension)
    const extendedDocument = document as SharedDocument & { is_owned?: boolean };
    if (extendedDocument.is_owned === true) {
      return true;
    }
    // Fallback to user_permissions.is_owner
    if (document.user_permissions?.is_owner) {
      return true;
    }
    return false;
  }

  openDocumentRenameModal(documentId: number, isFolder: boolean, currentName: string) {
    const modalRef = this.modalService.open(RenameModalComponent, {
      size: 'md',
      backdrop: 'static'
    });

    modalRef.componentInstance.documentId = documentId;
    modalRef.componentInstance.currentName = currentName;
    modalRef.componentInstance.isFolder = isFolder;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadDocuments();
        }
      },
      () => {
      }
    );
  }
}
