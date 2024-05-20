export interface Project {
  id: number
  project_name: string
  project_description: string
  created_at: Date
  updated_at: Date
  owner: string
  sessions: string[]
}

export interface ProjectQuery {
  count: number;
  next: string|null;
  previous: string|null;
  results: Project[];
}
