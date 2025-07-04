import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WebService } from '../../web.service';
import { ToastService } from '../../toast.service';
import { AccountsService } from '../accounts.service';
import {
  ImportTrackerList,
  ImportTrackerQuery,
  UserImportStatsResponse,
  ImportStats
} from '../../import-tracking';
import { NgClass, TitleCasePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-import-tracking-summary',
  templateUrl: './import-tracking-summary.component.html',
  styleUrls: ['./import-tracking-summary.component.scss'],
  imports: [
    NgClass,
    TitleCasePipe,
  ]
})
export class ImportTrackingSummaryComponent implements OnInit {
  recentImports: ImportTrackerList[] = [];
  stats: ImportStats | null = null;
  loading = false;

  constructor(
    private webService: WebService,
    private toastService: ToastService,
    private router: Router,
    private accountsService: AccountsService
  ) { }

  ngOnInit(): void {
    // Check if user is logged in before loading data
    if (this.accountsService.loggedIn) {
      this.loadRecentImports();
      this.loadStats();
    } else {
      // Wait for authentication to complete
      const checkAuth = () => {
        if (this.accountsService.loggedIn) {
          this.loadRecentImports();
          this.loadStats();
        } else {
          setTimeout(checkAuth, 100);
        }
      };
      checkAuth();
    }
  }

  loadRecentImports(): void {
    console.log('Loading recent imports...');
    this.loading = true;

    const params = {
      limit: 5,
      offset: 0,
      ordering: '-import_started_at'
    };

    this.webService.getImportTracking(params).subscribe({
      next: (response: ImportTrackerQuery) => {
        console.log('Recent imports loaded:', response);
        this.recentImports = response.results || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading recent imports:', error);
        this.toastService.show('Error loading import tracking data', 'error');
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    console.log('Loading import stats...');
    this.webService.getUserImportStats().subscribe({
      next: (response: UserImportStatsResponse) => {
        console.log('Import stats loaded:', response);
        this.stats = response.stats;
      },
      error: (error) => {
        console.error('Error loading import stats:', error);
        // Don't show error toast for stats as it's not critical
      }
    });
  }

  viewFullImportTracking(): void {
    this.router.navigate(['/import-tracking']);
  }

  viewImportDetail(importItem: ImportTrackerList): void {
    this.router.navigate(['/import-tracking', importItem.id]);
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
    return date.toLocaleDateString();
  }

  getSuccessRateColor(): string {
    if (!this.stats) return 'text-secondary';

    if (this.stats.success_rate >= 90) return 'text-success';
    if (this.stats.success_rate >= 70) return 'text-warning';
    return 'text-danger';
  }
}
