import {MetadataColumn} from "./metadata-column";

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
}

export interface InstrumentUsageQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: InstrumentUsage[];
}
