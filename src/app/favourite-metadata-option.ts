export interface FavouriteMetadataOption {
  id: number,
  user: number|null,
  name: string,
  type: string,
  value: string,
  display_name: string,
  lab_group: number|null,
  service_lab_group: number|null,
  preset: number|null,
  created_at: Date,
  updated_at: Date
}

export interface FavouriteMetadataOptionQuery {
  count: number
  next: string|null
  previous: string|null
  results: FavouriteMetadataOption[]
}
