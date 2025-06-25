export interface SiteSettings {
  id?: number;
  is_active?: boolean;
  site_name: string;
  site_tagline?: string;
  logo?: string;
  favicon?: string;
  banner_enabled: boolean;
  banner_text?: string;
  banner_color: string;
  banner_text_color: string;
  banner_dismissible: boolean;
  primary_color: string;
  secondary_color: string;
  footer_text?: string;
  created_at?: string;
  updated_at?: string;
  updated_by?: any;
}

export interface SiteSettingsQuery {
  ordering?: string;
  limit?: number;
  offset?: number;
}

export interface PublicSiteSettings {
  site_name: string;
  site_tagline?: string;
  logo?: string;
  favicon?: string;
  banner_enabled: boolean;
  banner_text?: string;
  banner_color: string;
  banner_text_color: string;
  banner_dismissible: boolean;
  primary_color: string;
  secondary_color: string;
  footer_text?: string;
}