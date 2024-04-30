import {ProtocolIngredient, ProtocolStepIngredient} from "./ingredient";

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
  ingredients: ProtocolIngredient[];
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
  ingredients: ProtocolStepIngredient[];
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
