import { MetadataColumn } from './metadata-column';

export interface SamplePool {
  id: number;
  pool_name: string;
  pooled_only_samples: number[];
  pooled_and_independent_samples: number[];
  instrument_job: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  is_reference: boolean;
  user_metadata?: MetadataColumn[];
  staff_metadata?: MetadataColumn[];
}

export interface SamplePoolCreateRequest {
  pool_name: string;
  pooled_only_samples: number[];
  pooled_and_independent_samples: number[];
  template_sample?: number;
  is_reference?: boolean;
}

export interface SamplePoolUpdateRequest {
  pool_name?: string;
  pooled_only_samples?: number[];
  pooled_and_independent_samples?: number[];
}

export interface SampleStatusOverview {
  sample_index: number;
  sample_name: string;
  status: 'Independent' | 'Pooled Only' | 'Mixed';
  pool_names: string[];
  sdrf_value: string;
}

export interface SamplePoolOverview {
  total_samples: number;
  pooled_samples: number;
  independent_samples: number;
  pools: SamplePool[];
}

export interface AddSampleRequest {
  sample_index: number;
  status: 'pooled_only' | 'pooled_and_independent';
}

export interface RemoveSampleRequest {
  sample_index: number;
}

export interface AddSampleResponse {
  message: string;
  pool: SamplePool;
}

export interface RemoveSampleResponse {
  message: string;
  pool: SamplePool;
}

export interface SamplePoolQuery {
  count: number;
  next: string | null;
  previous: string | null;
  results: SamplePool[];
}