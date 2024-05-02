export interface Tag {
  tag: string;
  created_at: string;
  updated_at: string;
  id: number;
}

export interface StepTag {
  id: number;
  step: number;
  tag: Tag;
  created_at: Date;
  updated_at: Date;
}

export interface ProtocolTag {
  id: number;
  protocol: number;
  tag: Tag;
  created_at: Date;
  updated_at: Date;
}

export interface ProtocolTagQuery {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProtocolTag[];
}

export interface StepTagQuery {
  count: number;
  next: string | null;
  previous: string | null;
  results: StepTag[];
}

export interface TagQuery {
  count: number;
  next: string | null;
  previous: string | null;
  results: Tag[];
}
