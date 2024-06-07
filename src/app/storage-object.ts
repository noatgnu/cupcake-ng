import {Reagent} from "./reagent";

export interface StorageObject {
  id: number;
  object_name: string;
  object_description: string;
  object_type: string;
  stored_at: number;
  stored_reagents: StoredReagent[];
  created_at: Date;
  updated_at: Date;
  can_delete: boolean;
  png_base64: string;
}

export interface StoredReagent {
  id: number;
  reagent: Reagent;
  quantity: number;
  storage_object: {id: number, object_name: string};
  created_at: Date;
  updated_at: Date;
  notes: string;
  user: string;
  png_base64: string;
}

export interface StorageObjectQuery {
  count: number;
  next: string;
  previous: string;
  results: StorageObject[];
}

export interface StoredReagentQuery {
  count: number;
  next: string;
  previous: string;
  results: StoredReagent[];
}
