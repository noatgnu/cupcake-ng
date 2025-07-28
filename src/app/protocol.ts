import {ProtocolReagent, ProtocolStepReagent} from "./reagent";
import {ProtocolTag, StepTag} from "./tag";
import {MetadataColumn} from "./metadata-column";

export interface Protocol {
  id: number;
  protocol_id: number;
  protocol_title: string;
  protocol_description: string;
  protocol_url: string;
  protocol_created_on: Date;
  protocol_version_uri: string;
  steps: ProtocolStep[];
  sections: ProtocolSection[];
  enabled: boolean;
  complexity_rating: number;
  duration_rating: number;
  reagents: ProtocolReagent[];
  tags: ProtocolTag[];
  metadata_columns: MetadataColumn[];
  user: {id: number, username: string}|null;
  is_vaulted: boolean;
  viewers?: {id: number, username: string}[];
  editors?: {id: number, username: string}[];
}

export interface ProtocolStep {
  id: number;
  protocol: number;
  step_id: number;
  step_description: string;
  step_duration: number;
  step_section: number;
  next_step: number[];
  previous_step: number;
  reagents: ProtocolStepReagent[];
  tags: StepTag[];
  created_at: Date;
  updated_at: Date;
}

export interface ProtocolSection {
  id: number;
  protocol: number;
  section_description: string;
  section_duration: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProtocolQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: Protocol[];
}

