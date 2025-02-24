import {LabGroup} from "./lab-group";

export interface User {
  id: number;
  username: string;
  lab_groups: LabGroup[];
}

export interface UserQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: User[];
}
