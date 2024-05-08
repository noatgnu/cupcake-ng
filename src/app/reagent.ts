export interface Reagent {
  id: number;
  name: string;
  unit: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProtocolReagent {
  id: number;
  reagent: Reagent;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProtocolStepReagent {
  id: number;
  reagent: Reagent;
  quantity: number;
  created_at: Date;
  updated_at: Date;
  scalable: boolean;
  scalable_factor: number;
}

export interface ReagentQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: Reagent[];
}
