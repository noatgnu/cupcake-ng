export interface DocumentPermission {
  id: number;
  annotation: number | null;
  folder: number | null;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  } | null;
  lab_group: string | null;
  user_id?: number;
  lab_group_id?: number;
  can_view: boolean;
  can_download: boolean;
  can_comment: boolean;
  can_edit: boolean;
  can_share: boolean;
  can_delete: boolean;
  shared_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  shared_at: string; // ISO date string
  expires_at: string | null; // ISO date string
  last_accessed: string | null; // ISO date string
  access_count: number;
  is_expired: boolean; // ReadOnlyField computed property
}

export interface DocumentPermissionQuery {
  count: number;
  next: string | null;
  previous: string | null;
  results: DocumentPermission[];
}

export interface SharedDocument {
  // Base AnnotationSerializer fields
  id: number;
  step: number | null;
  session: number | null;
  annotation: string;
  file: string | null;
  created_at: string;
  updated_at: string;
  annotation_type: string;
  transcribed: boolean;
  transcription: string | null;
  language: string | null;
  translation: string | null;
  scratched: boolean;
  annotation_name: string;
  folder: Array<{
    id: number;
    folder_name: string;
  }>;
  summary: string | null;
  instrument_usage: any[];
  metadata_columns: any[];
  fixed: boolean;
  user: {
    id: number;
    username: string;
  } | null;
  owner: {
    id: number;
    username: string;
  } | null;
  stored_reagent: number | null;

  document_permissions: DocumentPermission[];
  user_permissions: {
    can_view: boolean;
    can_download: boolean;
    can_comment: boolean;
    can_edit: boolean;
    can_share: boolean;
    can_delete: boolean;
    is_owner: boolean;
  } | null;
  sharing_stats: {
    total_shared: number;
    shared_with_users: number;
    shared_with_groups: number;
    total_access_count: number;
  } | null;
  file_info: {
    name: string;
    size: number;
    size_mb: number;
    extension: string;
    url: string | null;
  } | null;
}

export interface SharedDocumentQuery {
  count: number;
  next: string | null;
  previous: string | null;
  results: (SharedDocument & {
    folder_path?: string;
  })[];
}

export interface DocumentBreadcrumb {
  id: number;
  name: string;
  path: string;
}

export interface SharedFolder {
  id: number;
  name: string;
  type: 'folder';
  created_at: Date;
  updated_at: Date;
  document_count: number;
  has_subfolders: boolean;
  is_shared_document_folder: boolean;
  folder_path?: string;
  owner?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  } | null;
  is_owned?: boolean;
  permissions: DocumentPermission[];
  user_permissions: {
    can_view: boolean;
    can_download: boolean;
    can_comment: boolean;
    can_edit: boolean;
    can_share: boolean;
    can_delete: boolean;
    is_owner: boolean;
  };
  sharing_stats: {
    total_shared: number;
    shared_users: number;
    shared_groups: number;
    total_access_count: number;
  };
}

export interface DocumentBrowseResponse {
  documents: (SharedDocument & {
    type: 'file';
    is_owned: boolean;
    is_shared: boolean;
  })[];
  folders: SharedFolder[];
  breadcrumbs: DocumentBreadcrumb[];
  current_folder: {
    id: number | null;
    name: string;
    parent_id?: number | null;
    is_shared_document_folder: boolean;
  } | null;
  total_documents: number;
  total_folders: number;
  filter_type: 'all' | 'personal' | 'shared';
}

export interface DocumentSearchResponse {
  query: string;
  total_results: number;
  folders: SharedFolder[];
  documents: (SharedDocument & {
    folder_path: string;
  })[];
}

export interface DocumentShareRequest {
  users?: number[];
  lab_groups?: number[];
  permissions: {
    can_view: boolean;
    can_download: boolean;
    can_comment: boolean;
    can_edit: boolean;
    can_share: boolean;
    can_delete: boolean;
  };
}

export interface DocumentUnshareRequest {
  users?: number[];
  lab_groups?: number[];
}

export interface FolderShareRequest {
  folder_id: number;
  users?: number[];
  lab_groups?: number[];
  permissions: {
    can_view: boolean;
    can_download: boolean;
    can_comment: boolean;
    can_edit: boolean;
    can_share: boolean;
    can_delete: boolean;
  };
}

export interface FolderUnshareRequest {
  user_id?: number;
  lab_group_id?: number;
}

export interface FolderPermissionsResponse {
  folder: {
    id: number;
    name: string;
    owner: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
    } | null;
  };
  permissions: DocumentPermission[];
  total_permissions: number;
}

export interface DocumentCreateFolderRequest {
  folder_name: string;
  parent_folder?: number;
  is_shared_document_folder?: boolean;
  owner?: number;
}

export interface DocumentSignedUrlResponse {
  signed_token: string;
  expires_at: string;
}

export interface DocumentUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ChunkedUploadResponse {
  id: string;
  filename: string;
  offset: number;
  completed_at: Date | null;
}

export interface DocumentBindRequest {
  chunked_upload_id: string;
  annotation_name: string;
  folder?: number;
  annotation_type?: string;
}

export interface DocumentRenameRequest {
  annotation_id?: number|null;
  annotation_name?: string|null;
  folder_id?: number|null;
  folder_name?: string|null;
}
