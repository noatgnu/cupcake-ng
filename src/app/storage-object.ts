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
  user: string;
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
  barcode: string|null;
  shareable: boolean;
  current_quantity: number;
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

export interface ReagentAction {
  id: number;
  action_type: string;
  reagent: number;
  quantity: number;
  notes: string;
  user: string;
  created_at: Date;
  updated_at: Date;
  step_reagent: number;
}

export interface ReagentActionQuery {
  count: number;
  next: string;
  previous: string;
  results: ReagentAction[];
}
