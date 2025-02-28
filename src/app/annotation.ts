import {InstrumentUsage} from "./instrument";
import {MetadataColumn} from "./metadata-column";

export interface Annotation {
  id: number;
  step: number;
  session: number;
  annotation: string;
  file: any;
  created_at: Date;
  updated_at: Date;
  annotation_type: string;
  transcribed: boolean;
  transcription: string;
  language: string|null;
  translation: string|null;
  scratched: boolean;
  folder: {id: number, folder_name: string}[];
  annotation_name: string;
  summary: string;
  metadata_columns: MetadataColumn[];
  instrument_usage: InstrumentUsage[];
  fixed: boolean;
  user: {
    id: number;
    username: string;
  }|null;
}

export interface AnnotationQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: Annotation[];
}

export interface AnnotationFolder {
  id: number;
  folder_name: string;
  created_at: Date;
  updated_at: Date;
}
