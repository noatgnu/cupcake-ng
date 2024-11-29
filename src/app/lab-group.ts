export interface LabGroup {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface LabGroupQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: LabGroup[];
}
