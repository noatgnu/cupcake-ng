export interface UserBasic {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface SiteSettings {
  id?: number;
  is_active?: boolean;
  site_name: string;
  site_tagline?: string;
  logo?: string;
  favicon?: string;
  banner_enabled: boolean;
  banner_text?: string;
  banner_color: string;
  banner_text_color: string;
  banner_dismissible: boolean;
  primary_color: string;
  secondary_color: string;
  footer_text?: string;
  // Import restriction fields
  allow_import_protocols: boolean;
  allow_import_sessions: boolean;
  allow_import_annotations: boolean;
  allow_import_projects: boolean;
  allow_import_reagents: boolean;
  allow_import_instruments: boolean;
  allow_import_lab_groups: boolean;
  allow_import_messaging: boolean;
  allow_import_support_models: boolean;
  staff_only_import_override: boolean;
  import_archive_size_limit_mb: number;
  // Metadata fields
  created_at?: string;
  updated_at?: string;
  updated_by?: UserBasic;
}

export interface SiteSettingsQuery {
  ordering?: string;
  limit?: number;
  offset?: number;
}

export interface PublicSiteSettings {
  site_name: string;
  site_tagline?: string;
  logo?: string;
  favicon?: string;
  banner_enabled: boolean;
  banner_text?: string;
  banner_color: string;
  banner_text_color: string;
  banner_dismissible: boolean;
  primary_color: string;
  secondary_color: string;
  footer_text?: string;
}

export interface ImportOptions {
  protocols?: boolean;
  sessions?: boolean;
  annotations?: boolean;
  projects?: boolean;
  reagents?: boolean;
  instruments?: boolean;
  lab_groups?: boolean;
  messaging?: boolean;
  support_models?: boolean;
}

export interface AvailableImportOptionsResponse {
  available_options: ImportOptions;
  is_staff_override: boolean;
  max_archive_size_mb?: number;
}

export interface ExportOptions {
  protocols?: boolean;
  sessions?: boolean;
  annotations?: boolean;
  projects?: boolean;
  reagents?: boolean;
  instruments?: boolean;
  lab_groups?: boolean;
  messaging?: boolean;
  support_models?: boolean;
  format?: 'zip' | 'tar.gz';
}

export interface ImportDataPayload {
  upload_id: string;
  import_options?: ImportOptions;
}

export interface ExportDataPayload {
  export_options?: ExportOptions;
  protocol_id?: number;
  session_id?: number;
}

export interface DryRunAnalysisReport {
  archive_info: {
    file_path: string;
    file_size_bytes: number;
    file_size_mb: number;
    format: string;
    has_media: boolean;
  };
  data_summary: Record<string, number>;
  filtered_data_summary: Record<string, number>;
  potential_conflicts: Array<{
    type: string;
    description: string;
    items: string[];
    total_conflicts: number;
  }>;
  size_analysis: {
    total_media_files: number;
    total_media_size_bytes: number;
    total_media_size_mb: number;
    large_files: Array<{
      name: string;
      size_mb: number;
    }>;
    file_types: Record<string, number>;
  };
  import_plan: {
    execution_order: Array<{
      step: string;
      description: string;
      estimated_records: number;
    }>;
    estimated_duration_minutes: number;
    database_operations: number;
    file_operations: number;
    dependency_resolution: any[];
  };
  warnings: string[];
  errors: string[];
}

export interface DryRunResponse {
  success: boolean;
  analysis_report: DryRunAnalysisReport;
  metadata: any;
  archive_format: string;
  error?: string;
}