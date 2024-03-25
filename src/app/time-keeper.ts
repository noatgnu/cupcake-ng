export interface TimeKeeper {
  id: number;
  start_time: Date;
  session: number;
  step: number;
  current_duration: number;
  started: boolean;
}
