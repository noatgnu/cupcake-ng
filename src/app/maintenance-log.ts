export enum MaintenanceLogType {
  ROUTINE = "routine",
  EMERGENCY = "emergency",
  OTHER = "other",
}

export enum MaintenanceLogStatus {
  COMPLETED = "completed",
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  REQUESTED = "requested",
  CANCELLED = "cancelled",
}

export interface MaintenanceLog {
  id: number;
  instrument: number;
  maintenance_date: Date;
  maintenance_type: MaintenanceLogType;
  maintenance_description: string | null;
  maintenance_notes: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: number;
  status: MaintenanceLogStatus;
}

export interface MaintenanceLogCreate {
  instrument: number;
  maintenance_type: MaintenanceLogType;
  maintenance_description?: string;
  maintenance_notes?: string;
  status?: MaintenanceLogStatus;
}

export interface MaintenanceLogUpdate {
  instrument?: number;
  maintenance_type?: MaintenanceLogType;
  maintenance_description?: string;
  maintenance_notes?: string;
  status?: MaintenanceLogStatus;
}

export interface MaintenanceLogQuery {
  count: number;
  next: string | null;
  previous: string | null;
  results: MaintenanceLog[];
}
