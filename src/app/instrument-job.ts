import {Instrument, InstrumentUsage} from "./instrument";
import {Annotation} from "./annotation";
import {StoredReagent} from "./storage-object";
import {MetadataColumn} from "./metadata-column";

export interface InstrumentJob {
  id: number,
  instrument: Instrument,
  user: {
    id: number,
    username: string,
  },
  created_at: Date,
  updated_at: Date,
  status: string,
  project: {
    id: number,
    project_name: string,
    project_description: string,
  },
  job_type: string,
  session: {
    id: number,
    session_name: string,
    unique_id: string,
  },
  protocol: {
    id: number,
    protocol_title: string,
    protocol_description: string,
  },
  user_annotations: Annotation[],
  staff_annotations: Annotation[],
  assigned: boolean,
  staff: {
    id: number,
    username: string,
  }[],
  instrument_usage: InstrumentUsage|null,
  job_name: string,
  injection_volume: number,
  injection_unit: string,
  stored_reagent: StoredReagent|null,
  search_engine: string,
  search_engine_version: string,
  search_details: string,
  location: string,
  funder: string,
  cost_center: string,
  user_metadata: MetadataColumn[],
  staff_metadata: MetadataColumn[],
  sample_type: string,
  sample_number: number,
}

export interface InstrumentJobQuery {
  previous: string|null,
  next: string|null,
  results: InstrumentJob[],
  count: number,
}
