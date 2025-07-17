import {StorageObject} from "./storage-object";

export interface LabGroup {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  default_storage: StorageObject|null;
  can_perform_ms_analysis: boolean;
  is_core_facility: boolean;
  service_storage: StorageObject|null;
  managers?: LabGroupManager[];
}

export interface LabGroupManager {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface LabGroupQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: LabGroup[];
}
