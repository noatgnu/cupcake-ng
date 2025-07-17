export interface BackupLog {
  id: number;
  backup_type: 'database' | 'media' | 'full';
  backup_type_display: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  status_display: string;
  created_at: string; // ISO date string
  completed_at: string | null; // ISO date string
  duration_seconds: number | null;
  backup_file_path: string | null;
  file_size_bytes: number | null;
  file_size_mb: number | null;
  error_message: string | null;
  success_message: string | null;
  triggered_by: string;
  container_id: string | null;
}

export interface BackupLogQuery {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackupLog[];
}

export interface BackupStatusSummary {
  period_days: number;
  total_backups: number;
  success_rate: number;
  status_counts: {
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  latest_backups: {
    database: BackupLog | null;
    media: BackupLog | null;
    full: BackupLog | null;
  };
}

export interface BackupFilterParams {
  backup_type?: 'database' | 'media' | 'full';
  status?: 'running' | 'completed' | 'failed' | 'cancelled';
  triggered_by?: string;
  search?: string;
  ordering?: string;
  offset?: number;
  limit?: number;
}

export type BackupTypeChoice = {
  value: 'database' | 'media' | 'full';
  label: string;
};

export type BackupStatusChoice = {
  value: 'running' | 'completed' | 'failed' | 'cancelled';
  label: string;
};

export const BACKUP_TYPE_CHOICES: BackupTypeChoice[] = [
  { value: 'database', label: 'Database Backup' },
  { value: 'media', label: 'Media Backup' },
  { value: 'full', label: 'Full Backup' }
];

export const BACKUP_STATUS_CHOICES: BackupStatusChoice[] = [
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' }
];

// New interfaces for the BackupViewSet API endpoints

export interface BackupTriggerRequest {
  triggered_by: string;
}

export interface BackupTriggerResponse {
  success: boolean;
  message: string;
  backup_id: string;
}

export interface BackupStatus {
  status: 'idle' | 'in_progress' | 'completed' | 'failed' | 'error';
  message: string;
  details?: string;
  progress?: number;
  backup_id?: string;
}

export interface BackupHistoryResponse {
  backups: BackupHistoryItem[];
  total_count: number;
  period_days: number;
}

export interface BackupHistoryItem {
  id: string;
  backup_type: 'database' | 'media' | 'full';
  status: 'created' | 'in_progress' | 'completed' | 'failed';
  triggered_by: string;
  created_at: string;
  completed_at: string | null;
  file_size_mb: number | null;
  error_message: string | null;
  duration_seconds?: number;
}

export interface BackupProgress {
  status: 'created' | 'in_progress' | 'completed' | 'failed';
  message: string;
  progress: number;
  elapsed_seconds?: number;
  file_size_mb?: number | null;
  error?: string;
}