export interface ImportedObject {
  id: number;
  model_name: string;
  object_id: number;
  original_id: number | null;
  object_data: any;
  created_at: string;
}

export interface ImportedFile {
  id: number;
  file_path: string;
  original_name: string;
  file_size_bytes: number;
  created_at: string;
}

export interface ImportedRelationship {
  id: number;
  from_model: string;
  from_object_id: number;
  to_model: string;
  to_object_id: number;
  relationship_field: string;
  created_at: string;
}

export interface ImportTracker {
  id: number;
  import_id: string;
  user: number;
  user_username: string;
  user_full_name: string;
  archive_path: string;
  archive_size_mb: number;
  import_status: 'in_progress' | 'completed' | 'failed' | 'reverted';
  import_options: any;
  metadata: any;
  import_started_at: string;
  import_completed_at: string | null;
  duration: {
    seconds: number;
    formatted: string;
  } | null;
  total_objects_created: number;
  total_files_imported: number;
  total_relationships_created: number;
  can_revert: boolean;
  revert_reason: string | null;
  reverted_at: string | null;
  reverted_by: number | null;
  imported_objects: ImportedObject[];
  imported_files: ImportedFile[];
  imported_relationships: ImportedRelationship[];
  stats: {
    objects_by_type: { [key: string]: number };
    files_by_type: { [key: string]: number };
    relationships_by_field: { [key: string]: number };
    status_color: string;
  };
}

export interface ImportTrackerList {
  id: number;
  import_id: string;
  user: number;
  user_username: string;
  user_full_name: string;
  archive_path: string;
  archive_size_mb: number;
  import_status: 'in_progress' | 'completed' | 'failed' | 'reverted';
  status_color: string;
  import_started_at: string;
  import_completed_at: string | null;
  duration: {
    seconds: number;
    formatted: string;
  } | null;
  total_objects_created: number;
  total_files_imported: number;
  total_relationships_created: number;
  can_revert: boolean;
  reverted_at: string | null;
  reverted_by: number | null;
}

export interface ImportTrackerQuery {
  count: number;
  next: string | null;
  previous: string | null;
  results: ImportTrackerList[];
}

export interface ImportStats {
  total_imports: number;
  completed_imports: number;
  failed_imports: number;
  reverted_imports: number;
  in_progress_imports: number;
  total_objects_created: number;
  total_files_imported: number;
  success_rate: number;
}

export interface UserImportStatsResponse {
  stats: ImportStats;
  recent_imports: ImportTrackerList[];
}

export interface RevertImportResponse {
  success: boolean;
  message?: string;
  error?: string;
  stats?: {
    objects_deleted: number;
    files_deleted: number;
    relationships_deleted: number;
  };
  details?: any;
}