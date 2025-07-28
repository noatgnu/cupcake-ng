import {TimeKeeper} from "./time-keeper";
import {Protocol} from "./protocol";

export interface ProtocolSession {
  id: number;
  unique_id: string;
  user: {id: number, username: string}|null;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
  protocols: number[];
  protocol_objects?: Protocol[];
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
