export interface MetadataColumn {
  name: string,
  type: string,
  column_position: number,
  value: string,
  stored_reagent: number|null,
  id: number,
  created_at: Date,
  updated_at: Date,
  not_applicable: boolean,
  mandatory: boolean,
}

export interface MetadataColumnQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: MetadataColumn[];
}

