export interface Preset {
  id: number,
  name: string,
  user: number,
  created_at: Date,
  updated_at: Date,
}

export interface PresetQuery {
  count: number,
  next: string|null,
  previous: string|null,
  results: Preset[]
}
