

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
  modifiers: {
    samples: string,
    value: string,
  }[],
  hidden: boolean,
  auto_generated: boolean,
  readonly: boolean,
}

export interface MetadataColumnQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: MetadataColumn[];
}

export interface MetadataTableTemplate {
  name: string,
  user_columns: MetadataColumn[],
  staff_columns: MetadataColumn[],
  hidden_user_columns: number,
  hidden_staff_columns: number,
  id: number,
  created_at: Date,
  updated_at: Date,
  service_lab_group: number,
  lab_group: number,
  user: number,
  enabled: boolean,
  field_mask_mapping: {name: string, mask: string}[],
}

export interface MetadataTableTemplateQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: MetadataTableTemplate[];
}



