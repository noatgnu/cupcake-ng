import {TimeKeeper} from "./time-keeper";

export interface ProtocolSession {
  id: number;
  unique_id: string;
  user: number;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
  protocol: number[];
  name: string;
  time_keeper: TimeKeeper[];
}
