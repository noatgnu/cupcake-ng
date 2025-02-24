import {StorageObject} from "./storage-object";

export interface LabGroup {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  default_storage: StorageObject|null;
}

export interface LabGroupQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: LabGroup[];
}
