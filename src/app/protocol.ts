export interface Protocol {
  id: number;
  protocol_id: number;
  protocol_title: string;
  protocol_description: string;
  protocol_url: string;
  protocol_created_on: Date;
  protocol_version_uri: string;
  steps: ProtocolStep[];
}

export interface ProtocolStep {
  id: number;
  protocol: number;
  step_id: number;
  step_description: string;
  step_duration: number;
  step_section: string;
  step_section_duration: number;
  next_step: number[];
}
