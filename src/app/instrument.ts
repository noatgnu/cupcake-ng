export interface Instrument {
  id: number;
  instrument_name: string;
  instrument_description: string;
  created_at: Date;
  updated_at: Date;
  enabled: boolean;
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
}

export interface InstrumentUsageQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: InstrumentUsage[];
}
