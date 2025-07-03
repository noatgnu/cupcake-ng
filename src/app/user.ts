import {LabGroup} from "./lab-group";
import {UserBasic} from "./site-settings";

export interface User {
  id: number;
  username: string;
  lab_groups: LabGroup[];
  managed_lab_groups?: LabGroup[];
  email: string;
  first_name: string;
  last_name: string;
  is_staff?: boolean;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string;
}

export interface UserBasicQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: UserBasic[];
}



export interface UserQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: User[];
}

// New interfaces for enhanced user management
export interface UserActivitySummary {
  total_counts: {
    protocols: number;
    sessions: number;
    annotations: number;
    projects: number;
    stored_reagents: number;
  };
  recent_activity: {
    protocols_last_30_days: number;
    sessions_last_30_days: number;
    annotations_last_30_days: number;
  };
  lab_groups: {
    member_of: number;
    managing: number;
  };
}

export interface UserStatistics {
  user_info: {
    id: number;
    username: string;
    full_name: string;
    email: string;
    is_staff: boolean;
    date_joined: string;
    last_login: string;
  };
  protocols: {
    total: number;
    enabled: number;
    last_week: number;
    last_month: number;
  };
  sessions: {
    total: number;
    enabled: number;
    last_week: number;
    last_month: number;
  };
  annotations: {
    total: number;
    with_files: number;
    last_week: number;
    last_month: number;
  };
  projects: {
    owned: number;
    last_month: number;
  };
  lab_groups: {
    member_of: number;
    managing: number;
  };
  storage: {
    stored_reagents: number;
    storage_objects: number;
  };
}

export interface UserDashboardData {
  user_info: {
    username: string;
    full_name: string;
    email: string;
    is_staff: boolean;
  };
  quick_stats: {
    total_protocols: number;
    total_sessions: number;
    total_annotations: number;
    lab_groups_count: number;
  };
  recent_activity: {
    protocols: RecentProtocol[];
    sessions: RecentSession[];
    annotations: RecentAnnotation[];
  };
  lab_groups: LabGroupInfo[];
}

export interface RecentProtocol {
  id: number;
  title: string;
  created: string;
}

export interface RecentSession {
  id: number;
  name: string;
  created: string;
}

export interface RecentAnnotation {
  id: number;
  annotation: string;
  created: string;
}

export interface LabGroupInfo {
  id: number;
  name: string;
  member_count: number;
  is_professional: boolean;
}

export interface UserPreferences {
  profile: {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  lab_settings: {
    default_lab_groups: number[];
    managed_lab_groups: number[];
  };
  permissions: {
    is_staff: boolean;
    is_superuser: boolean;
  };
}

export interface LabGroupManagement {
  managed_groups: ManagedLabGroup[];
  member_groups: LabGroupInfo[];
  summary: {
    managing_count: number;
    member_count: number;
    total_managed_members: number;
  };
}

export interface ManagedLabGroup extends LabGroupInfo {
  description: string;
  members: User[];
}

export interface PlatformAnalytics {
  users: {
    total: number;
    active: number;
    staff: number;
    new_last_30_days: number;
  };
  resources: {
    protocols: number;
    sessions: number;
    annotations: number;
    projects: number;
    lab_groups: number;
  };
  recent_activity: {
    protocols_last_30_days: number;
    sessions_last_30_days: number;
    annotations_last_30_days: number;
  };
  top_active_users: ActiveUser[];
}

export interface ActiveUser {
  id: number;
  username: string;
  protocols: number;
  sessions: number;
  annotations: number;
  total_activity: number;
}

export interface UserPermissionMatrix {
  user_id: number;
  username: string;
  permissions: ResourcePermission[];
}

export interface ResourcePermission {
  resource_id: number;
  edit: boolean;
  view: boolean;
  delete: boolean;
}

export interface UserSearchQuery {
  q?: string;
  lab_group?: number;
  role?: 'staff' | 'regular';
  active?: boolean;
}

export interface UserAccountAction {
  user_id: number;
  reason?: string;
}
