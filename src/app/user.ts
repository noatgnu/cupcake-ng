export interface User {
  id: number;
  username: string;
}

export interface UserQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: User[];
}
