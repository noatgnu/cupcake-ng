import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NgbModal, NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap';
import { BackupService } from '../backup.service';
import { AccountsService } from '../../accounts/accounts.service';
import {
  BackupLog, BackupLogQuery, BackupFilterParams, BackupStatusSummary, BACKUP_TYPE_CHOICES, BACKUP_STATUS_CHOICES,
  BackupStatusChoice
} from '../backup';

@Component({
  selector: 'app-backup-log-viewer',
  imports: [CommonModule, FormsModule, NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem],
  templateUrl: './backup-log-viewer.component.html',
  styleUrl: './backup-log-viewer.component.scss'
})
export class BackupLogViewerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Access control
  hasAccess = false;
  loading = true;
  error: string | null = null;

  // Data
  backupLogs: BackupLog[] = [];
  statusSummary: BackupStatusSummary | null = null;
  totalCount = 0;

  // Filtering and pagination
  filters: BackupFilterParams = {
    limit: 50,
    offset: 0,
    ordering: '-created_at'
  };
  searchQuery = '';

  // Filter options
  backupTypeChoices = BACKUP_TYPE_CHOICES;
  statusChoices = BACKUP_STATUS_CHOICES;

  // UI state
  currentPage = 1;
  readonly itemsPerPage = 50;
  
  // Expose Math for template
  Math = Math;

  constructor(
    private backupService: BackupService,
    private accounts: AccountsService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.checkAccess();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAccess(): void {
    // Only staff members can access backup logs
    if (!this.accounts.is_staff) {
      this.hasAccess = false;
      this.loading = false;
      this.error = 'Access denied. Staff privileges required to view backup logs.';
      return;
    }

    this.hasAccess = true;
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    // Load both backup logs and status summary
    Promise.all([
      this.loadBackupLogs(),
      this.loadStatusSummary()
    ]).finally(() => {
      this.loading = false;
    });
  }

  private loadBackupLogs(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.backupService.getBackupLogs(this.filters).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (data: BackupLogQuery) => {
          this.backupLogs = data.results;
          this.totalCount = data.count;
          resolve();
        },
        error: (err) => {
          this.error = 'Failed to load backup logs.';
          console.error('Error loading backup logs:', err);
          reject(err);
        }
      });
    });
  }

  private loadStatusSummary(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.backupService.getBackupStatusSummary().pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (data: BackupStatusSummary) => {
          this.statusSummary = data;
          resolve();
        },
        error: (err) => {
          console.error('Error loading backup status:', err);
          // Don't fail the whole component if status summary fails
          resolve();
        }
      });
    });
  }

  // Filter methods
  onFilterChange(): void {
    this.currentPage = 1;
    this.filters.offset = 0;
    this.loadBackupLogs();
  }

  onSearchChange(): void {
    this.filters.search = this.searchQuery.trim() || undefined;
    this.onFilterChange();
  }

  clearFilters(): void {
    this.filters = {
      limit: this.itemsPerPage,
      offset: 0,
      ordering: '-created_at'
    };
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadBackupLogs();
  }

  // Pagination methods
  onPageChange(page: number): void {
    this.currentPage = page;
    this.filters.offset = (page - 1) * this.itemsPerPage;
    this.loadBackupLogs();
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.itemsPerPage);
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  get hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  // Utility methods from service
  formatFileSize(sizeBytes: number | null): string {
    return this.backupService.formatFileSize(sizeBytes);
  }

  formatDuration(seconds: number | null): string {
    return this.backupService.formatDuration(seconds);
  }

  getStatusColorClass(status: "running"| "completed"|"failed"|"cancelled"): string {
    return this.backupService.getStatusColorClass(status);
  }

  getBackupTypeIcon(backupType: "database"|"media"|"full"): string {
    return this.backupService.getBackupTypeIcon(backupType);
  }

  getStatusIcon(status: "running"| "completed"|"failed"|"cancelled"): string {
    return this.backupService.getStatusIcon(status);
  }

  getRelativeTime(dateString: string): string {
    return this.backupService.getRelativeTime(dateString);
  }

  // Status check methods
  isBackupActive(log: BackupLog): boolean {
    return this.backupService.isBackupActive(log);
  }

  isBackupSuccessful(log: BackupLog): boolean {
    return this.backupService.isBackupSuccessful(log);
  }

  isBackupFailed(log: BackupLog): boolean {
    return this.backupService.isBackupFailed(log);
  }

  // Get success rate as percentage
  getSuccessRatePercentage(): number {
    if (!this.statusSummary) return 0;
    
    // Handle both decimal (0.85) and percentage (85) formats from backend
    const rate = this.statusSummary.success_rate;
    if (rate <= 1) {
      // Backend sent decimal format (0-1), convert to percentage
      return Math.round(rate * 100);
    } else {
      // Backend sent percentage format (0-100), use as is
      return Math.round(rate);
    }
  }

  // Sort methods
  sortBy(field: string): void {
    const currentOrdering = this.filters.ordering || '';

    if (currentOrdering === field) {
      // Currently ascending, switch to descending
      this.filters.ordering = `-${field}`;
    } else if (currentOrdering === `-${field}`) {
      // Currently descending, switch to ascending
      this.filters.ordering = field;
    } else {
      // Different field, start with descending (most recent first)
      this.filters.ordering = `-${field}`;
    }

    this.onFilterChange();
  }

  getSortIcon(field: string): string {
    const ordering = this.filters.ordering || '';
    if (ordering === field) {
      return 'bi-sort-up';
    } else if (ordering === `-${field}`) {
      return 'bi-sort-down';
    }
    return 'bi-sort';
  }
}
