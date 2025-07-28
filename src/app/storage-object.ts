import {Reagent} from "./reagent";
import {MetadataColumn} from "./metadata-column";
import {ProtocolStep} from "./protocol";

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
  child_count: number;
  path_to_root: {id: number, name: string}[];
  is_vaulted: boolean;
}

export interface StoredReagent {
  id: number;
  reagent: Reagent;
  quantity: number;
  storage_object: {id: number, object_name: string};
  created_at: Date;
  updated_at: Date;
  notes: string;
  user: {id: number, username: string};
  png_base64: string;
  barcode: string|null;
  shareable: boolean;
  access_all: boolean;
  current_quantity: number;
  expiration_date: Date;
  created_by_project: number|null;
  created_by_session: string|null;
  created_by_protocol: number|null;
  created_by_step: ProtocolStep|null;
  metadata_columns: MetadataColumn[];
  low_stock_threshold: number|null;
  notify_on_low_stock: boolean;
  last_notification_sent: Date|null;
  notify_days_before_expiry: number|null;
  notify_on_expiry: boolean;
  last_expiry_notification_sent: Date|null;
  is_subscribed: boolean;
  subscriber_count: number;
  subscription: {
    id: number
    notify_on_low_stock: boolean
    notify_on_expiry: boolean
  };
  is_vaulted: boolean;
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

export interface ReagentSubscription {
  user_email: string;
  user_name: string;
  reagent_name: string;
}
