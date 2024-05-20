import {TimeKeeper} from "./time-keeper";

export interface ProtocolSession {
  id: number;
  unique_id: string;
  user: number;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
  protocols: number[];
  name: string;
  time_keeper: TimeKeeper[];
  started_at?: Date;
  ended_at?: Date;
  projects: number[];
}

export interface ProtocolSessionQuery {
  count: number;
  next: string;
  previous: string;
  results: ProtocolSession[];
}
