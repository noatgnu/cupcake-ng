import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  BackupLog,
  BackupLogQuery,
  BackupStatusSummary,
  BackupFilterParams
} from './backup';

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private apiUrl = `${environment.baseURL}/api/backup_logs`;

  constructor(private http: HttpClient) { }

  // Get paginated list of backup logs with filtering
  getBackupLogs(params?: BackupFilterParams): Observable<BackupLogQuery> {
    let httpParams = new HttpParams();
    
    if (params?.backup_type) {
      httpParams = httpParams.set('backup_type', params.backup_type);
    }
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.triggered_by) {
      httpParams = httpParams.set('triggered_by', params.triggered_by);
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.ordering) {
      httpParams = httpParams.set('ordering', params.ordering);
    }
    if (params?.offset !== undefined) {
      httpParams = httpParams.set('offset', params.offset.toString());
    }
    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<BackupLogQuery>(this.apiUrl + '/', { params: httpParams });
  }

  // Get specific backup log by ID
  getBackupLog(id: number): Observable<BackupLog> {
    return this.http.get<BackupLog>(`${this.apiUrl}/${id}/`);
  }

  // Get backup status summary for last 30 days
  getBackupStatus(): Observable<BackupStatusSummary> {
    return this.http.get<BackupStatusSummary>(`${this.apiUrl}/backup_status/`);
  }

  // Utility methods

  // Format file size for display
  formatFileSize(sizeInBytes: number | null): string {
    if (!sizeInBytes) return 'Unknown size';

    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (sizeInBytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
    return Math.round(sizeInBytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Format duration for display
  formatDuration(durationSeconds: number | null): string {
    if (!durationSeconds) return 'Unknown duration';

    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = durationSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Get status color class for UI styling
  getStatusColorClass(status: BackupLog['status']): string {
    switch (status) {
      case 'running':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'cancelled':
        return 'text-gray-600';
      default:
        return 'text-gray-500';
    }
  }

  // Get backup type icon
  getBackupTypeIcon(backupType: BackupLog['backup_type']): string {
    switch (backupType) {
      case 'database':
        return 'storage';
      case 'media':
        return 'perm_media';
      case 'full':
        return 'backup';
      default:
        return 'backup';
    }
  }

  // Get status icon
  getStatusIcon(status: BackupLog['status']): string {
    switch (status) {
      case 'running':
        return 'autorenew';
      case 'completed':
        return 'check_circle';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'cancel';
      default:
        return 'help';
    }
  }

  // Check if backup is active (running)
  isBackupActive(backup: BackupLog): boolean {
    return backup.status === 'running';
  }

  // Check if backup was successful
  isBackupSuccessful(backup: BackupLog): boolean {
    return backup.status === 'completed';
  }

  // Check if backup failed
  isBackupFailed(backup: BackupLog): boolean {
    return backup.status === 'failed';
  }

  // Calculate success rate percentage
  calculateSuccessRate(successCount: number, totalCount: number): number {
    if (totalCount === 0) return 0;
    return Math.round((successCount / totalCount) * 100);
  }

  // Get relative time string (e.g., "2 hours ago")
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}