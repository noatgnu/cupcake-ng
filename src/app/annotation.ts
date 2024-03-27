export interface Annotation {
  id: number;
  step: number;
  session: number;
  annotation: string;
  file: any;
  created_at: Date;
  updated_at: Date;
  annotation_type: string;
}

export interface AnnotationQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: Annotation[];
}
