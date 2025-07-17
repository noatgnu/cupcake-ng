import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  BackupLog,
  BackupLogQuery,
  BackupStatusSummary,
  BackupFilterParams,
  BackupTriggerRequest,
  BackupTriggerResponse,
  BackupStatus,
  BackupHistoryResponse,
  BackupHistoryItem,
  BackupProgress
} from './backup';

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private backupApiUrl = `${environment.baseURL}/api/backups`;

  constructor(private http: HttpClient) { }

  // Get paginated list of backup logs with filtering (using new API)
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

    return this.http.get<BackupLogQuery>(this.backupApiUrl + '/', { params: httpParams });
  }

  // Get specific backup log by ID
  getBackupLog(id: number): Observable<BackupLog> {
    return this.http.get<BackupLog>(`${this.backupApiUrl}/${id}/`);
  }

  // Get backup status summary - now uses the new status endpoint
  getBackupStatus(): Observable<BackupStatus> {
    return this.getCurrentBackupStatus();
  }

  // Get backup status summary for backup log viewer (legacy method)
  getBackupStatusSummary(): Observable<BackupStatusSummary> {
    // Convert the new backup history to the old format for the backup log viewer
    return this.getBackupHistory(30, 100).pipe(
      map((historyResponse: BackupHistoryResponse) => {
        const backups = historyResponse.backups;
        
        // Count by status
        const statusCounts = {
          running: backups.filter(b => b.status === 'in_progress').length,
          completed: backups.filter(b => b.status === 'completed').length,
          failed: backups.filter(b => b.status === 'failed').length,
          cancelled: 0 // Not available in new API
        };

        // Transform BackupHistoryItem to BackupLog format
        const transformHistoryItem = (item: BackupHistoryItem): BackupLog => ({
          id: parseInt(item.id),
          backup_type: item.backup_type,
          backup_type_display: item.backup_type.charAt(0).toUpperCase() + item.backup_type.slice(1),
          status: item.status === 'created' ? 'running' : 
                  item.status === 'in_progress' ? 'running' : 
                  item.status as 'completed' | 'failed',
          status_display: item.status === 'created' ? 'Running' : 
                          item.status === 'in_progress' ? 'Running' : 
                          item.status.charAt(0).toUpperCase() + item.status.slice(1),
          created_at: item.created_at,
          completed_at: item.completed_at,
          duration_seconds: item.duration_seconds || null,
          backup_file_path: null, // Not available in new API
          file_size_bytes: item.file_size_mb ? item.file_size_mb * 1024 * 1024 : null,
          file_size_mb: item.file_size_mb,
          error_message: item.error_message,
          success_message: item.status === 'completed' ? 'Backup completed successfully' : null,
          triggered_by: item.triggered_by,
          container_id: null // Not available in new API
        });

        // Get latest backups by type
        const latestBackups = {
          database: backups.find(b => b.backup_type === 'database') ? transformHistoryItem(backups.find(b => b.backup_type === 'database')!) : null,
          media: backups.find(b => b.backup_type === 'media') ? transformHistoryItem(backups.find(b => b.backup_type === 'media')!) : null,
          full: backups.find(b => b.backup_type === 'full') ? transformHistoryItem(backups.find(b => b.backup_type === 'full')!) : null
        };

        // Calculate success rate
        const totalBackups = backups.length;
        const successfulBackups = statusCounts.completed;
        const successRate = totalBackups > 0 ? (successfulBackups / totalBackups) * 100 : 0;

        return {
          period_days: historyResponse.period_days,
          total_backups: totalBackups,
          success_rate: successRate,
          status_counts: statusCounts,
          latest_backups: latestBackups
        };
      })
    );
  }

  // Manual backup operations
  
  // Trigger a manual backup
  triggerManualBackup(triggeredBy: string = 'manual'): Observable<BackupTriggerResponse> {
    const request: BackupTriggerRequest = { triggered_by: triggeredBy };
    return this.http.post<BackupTriggerResponse>(`${this.backupApiUrl}/trigger/`, request);
  }

  // Get current backup status
  getCurrentBackupStatus(): Observable<BackupStatus> {
    return this.http.get<BackupStatus>(`${this.backupApiUrl}/status/`);
  }

  // Get backup history
  getBackupHistory(days: number = 30, limit: number = 50): Observable<BackupHistoryResponse> {
    const params = new HttpParams()
      .set('days', days.toString())
      .set('limit', limit.toString());
    return this.http.get<BackupHistoryResponse>(`${this.backupApiUrl}/history/`, { params });
  }

  // Get progress of a specific backup
  getBackupProgress(backupId: string): Observable<BackupProgress> {
    return this.http.get<BackupProgress>(`${this.backupApiUrl}/${backupId}/progress/`);
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