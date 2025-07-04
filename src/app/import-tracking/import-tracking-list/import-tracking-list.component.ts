import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {NgbModal, NgbPagination} from '@ng-bootstrap/ng-bootstrap';
import { WebService } from '../../web.service';
import { ToastService } from '../../toast.service';
import {
  ImportTrackerList,
  ImportTrackerQuery,
  UserImportStatsResponse,
  ImportStats
} from '../../import-tracking';
import { AreYouSureModalComponent } from '../../are-you-sure-modal/are-you-sure-modal.component';
import {FormsModule} from "@angular/forms";
import {NgClass, TitleCasePipe} from "@angular/common";

@Component({
  selector: 'app-import-tracking-list',
  templateUrl: './import-tracking-list.component.html',
  imports: [
    FormsModule,
    NgClass,
    TitleCasePipe,
    NgbPagination
  ],
  styleUrls: ['./import-tracking-list.component.scss']
})
export class ImportTrackingListComponent implements OnInit {
  imports: ImportTrackerList[] = [];
  stats: ImportStats | null = null;
  loading = false;
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;

  // Filters
  statusFilter: string = '';
  searchTerm: string = '';

  // Sorting
  sortField = 'import_started_at';
  sortDirection = 'desc';

  constructor(
    private webService: WebService,
    private toastService: ToastService,
    private modalService: NgbModal,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Wait for accounts service to be initialized
    if (this.webService && (this.webService as any).accountsService?.loggedIn !== undefined) {
      this.loadImports();
      this.loadStats();
    } else {
      // Check every 100ms until accounts are loaded
      const checkAccounts = () => {
        if (this.webService && (this.webService as any).accountsService?.loggedIn !== undefined) {
          this.loadImports();
          this.loadStats();
        } else {
          setTimeout(checkAccounts, 100);
        }
      };
      checkAccounts();
    }
  }

  loadImports(): void {
    this.loading = true;

    const params = {
      page: this.currentPage,
      page_size: this.pageSize,
      ordering: this.sortDirection === 'desc' ? `-${this.sortField}` : this.sortField
    };

    if (this.statusFilter) {
      (params as any).import_status = this.statusFilter;
    }

    if (this.searchTerm) {
      (params as any).search = this.searchTerm;
    }

    this.webService.getImportTracking(params).subscribe({
      next: (response: ImportTrackerQuery) => {
        this.imports = response.results;
        this.totalCount = response.count;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading imports:', error);
        this.toastService.show('Error loading import tracking data', 'error');
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    this.webService.getUserImportStats().subscribe({
      next: (response: UserImportStatsResponse) => {
        this.stats = response.stats;
      },
      error: (error) => {
        console.error('Error loading import stats:', error);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadImports();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.loadImports();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadImports();
  }

  viewImportDetail(importItem: ImportTrackerList): void {
    this.router.navigate(['/import-tracking', importItem.id]);
  }

  revertImport(importItem: ImportTrackerList): void {
    const modalRef = this.modalService.open(AreYouSureModalComponent);
    modalRef.componentInstance.title = 'Revert Import';
    modalRef.componentInstance.message = `Are you sure you want to revert the import "${importItem.import_id}"? This will permanently delete all imported data and cannot be undone.`;
    modalRef.componentInstance.confirmText = 'Revert Import';
    modalRef.componentInstance.confirmClass = 'btn-warning';

    modalRef.result.then((result) => {
      if (result) {
        this.performRevert(importItem);
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  private performRevert(importItem: ImportTrackerList): void {
    this.loading = true;

    this.webService.revertImport(importItem.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.show(`Import successfully reverted: ${response.message}`, 'success');
          this.loadImports();
          this.loadStats();
        } else {
          this.toastService.show(`Failed to revert import: ${response.error}`, 'error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error reverting import:', error);
        this.toastService.show('Error reverting import', 'error');
        this.loading = false;
      }
    });
  }

  deleteImport(importItem: ImportTrackerList): void {
    const modalRef = this.modalService.open(AreYouSureModalComponent);
    modalRef.componentInstance.title = 'Delete Import Record';
    modalRef.componentInstance.message = `Are you sure you want to delete the import record "${importItem.import_id}"? This will only delete the tracking record, not the imported data.`;
    modalRef.componentInstance.confirmText = 'Delete Record';
    modalRef.componentInstance.confirmClass = 'btn-danger';

    modalRef.result.then((result) => {
      if (result) {
        this.performDelete(importItem);
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  private performDelete(importItem: ImportTrackerList): void {
    this.loading = true;

    this.webService.deleteImportTracking(importItem.id).subscribe({
      next: () => {
        this.toastService.show('Import record deleted successfully', 'success');
        this.loadImports();
        this.loadStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error deleting import record:', error);
        this.toastService.show('Error deleting import record', 'error');
        this.loading = false;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'completed': 'badge-success',
      'in_progress': 'badge-primary',
      'failed': 'badge-danger',
      'reverted': 'badge-warning'
    };
    return statusClasses[status] || 'badge-secondary';
  }

  formatFileSize(sizeInMB: number): string {
    if (sizeInMB < 1) {
      return `${Math.round(sizeInMB * 1024)} KB`;
    } else if (sizeInMB < 1024) {
      return `${sizeInMB.toFixed(1)} MB`;
    } else {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
}
