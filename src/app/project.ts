export interface Project {
  id: number
  project_name: string
  project_description: string
  created_at: Date
  updated_at: Date
  owner: string
  user: {id: number, username: string}|null
  sessions: {unique_id: string, protocol: number[], name: string}[]
  is_vaulted: boolean
  viewers?: {id: number, username: string}[]
  editors?: {id: number, username: string}[]
}

export interface ProjectQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: Project[];
}
