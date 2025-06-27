import {MetadataColumn} from "./metadata-column";
import {AnnotationFolder} from "./annotation";

export interface Instrument {
  id: number;
  instrument_name: string;
  instrument_description: string;
  created_at: Date;
  updated_at: Date;
  enabled: boolean;
  metadata_columns: MetadataColumn[];
  max_days_within_usage_pre_approval: number;
  max_days_ahead_pre_approval: number;
  days_before_maintenance_notification: number;
  days_before_warranty_notification: number;
  last_maintenance_notification_sent: Date|null;
  last_warranty_notification_sent: Date|null;
  annotation_folders: AnnotationFolder[];
  image: string|null;
  support_information: SupportInformation[];
  accepts_bookings: boolean;
}

export interface InstrumentQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: Instrument[];
}

export interface InstrumentUsage {
  id: number;
  instrument: number;
  annotation: number;
  created_at: Date;
  updated_at: Date;
  time_started: Date;
  time_ended: Date;
  user: string;
  approved: boolean;
  maintenance: boolean;
  approved_by: number|null;
}

export interface InstrumentUsageQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: InstrumentUsage[];
}

export interface ExternalContactDetails {
  id?: number;
  contact_method_alt_name: string;
  contact_type: string;
  contact_value: string;
}

export interface ExternalContact {
  id?: number;
  contact_name: string;
  contact_details: ExternalContactDetails[];
}

export interface SupportInformation {
  id?: number;
  vendor_name: string;
  vendor_contacts: ExternalContact[];
  manufacturer_name: string;
  manufacturer_contacts: ExternalContact[];
  serial_number?: string;
  maintenance_frequency_days?: number;
  location_id?: number;
  location?: {
    id: number;
    object_name: string;
    object_type: string;
    object_description: string;
  };
  warranty_start_date?: Date;
  warranty_end_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface InstrumentSupportInfo {
  instrument_id: number;
  support_information_id: number;
}

export interface MaintenanceStatus {
  has_maintenance_record: boolean;
  maintenance_frequency_days: number | null;
  last_maintenance_date?: string;
  days_since_last_maintenance?: number;
  next_maintenance_date?: string;
  days_until_next_maintenance?: number;
  is_overdue?: boolean;
  overdue_days?: number | null;
}
