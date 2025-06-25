import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { PublicSiteSettings, SiteSettings } from './site-settings';

@Injectable({
  providedIn: 'root'
})
export class SiteSettingsService {
  private readonly apiUrl = `${environment.baseURL}/api/site_settings/`;
  private readonly publicApiUrl = `${environment.baseURL}/api/site_settings/public/`;

  // BehaviorSubject to hold current public settings
  private publicSettingsSubject = new BehaviorSubject<PublicSiteSettings | null>(null);
  public publicSettings$ = this.publicSettingsSubject.asObservable();

  // BehaviorSubject for banner dismissal state
  private bannerDismissedSubject = new BehaviorSubject<boolean>(false);
  public bannerDismissed$ = this.bannerDismissedSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load banner dismissed state from localStorage
    const dismissed = localStorage.getItem('banner_dismissed') === 'true';
    this.bannerDismissedSubject.next(dismissed);

    // Load public settings on service initialization
    this.loadPublicSettings();
  }

  /**
   * Get public site settings (no authentication required)
   */
  getPublicSettings(): Observable<PublicSiteSettings> {
    return this.http.get<PublicSiteSettings>(this.publicApiUrl).pipe(
      tap(settings => this.publicSettingsSubject.next(settings))
    );
  }

  /**
   * Load public settings and store in service
   */
  loadPublicSettings(): void {
    this.getPublicSettings().subscribe({
      next: (settings) => {
        // Settings loaded successfully
      },
      error: (error) => {
        console.error('Failed to load public site settings:', error);
      }
    });
  }

  /**
   * Get current site settings (authenticated)
   */
  getCurrentSettings(): Observable<SiteSettings> {
    return this.http.get<SiteSettings>(this.apiUrl).pipe(
      map(response => response || this.getDefaultSettings())
    );
  }

  /**
   * Create new site settings
   */
  createSettings(settings: Partial<SiteSettings>): Observable<SiteSettings> {
    return this.http.post<SiteSettings>(this.apiUrl, settings);
  }

  /**
   * Update existing site settings
   */
  updateSettings(id: number, settings: Partial<SiteSettings>): Observable<SiteSettings> {
    return this.http.patch<SiteSettings>(`${this.apiUrl}${id}/`, settings).pipe(
      tap(() => {
        // Reload public settings after update
        this.loadPublicSettings();
      })
    );
  }

  /**
   * Upload logo file
   */
  uploadLogo(id: number, file: File): Observable<SiteSettings> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.patch<SiteSettings>(`${this.apiUrl}${id}/`, formData);
  }

  /**
   * Upload favicon file
   */
  uploadFavicon(id: number, file: File): Observable<SiteSettings> {
    const formData = new FormData();
    formData.append('favicon', file);
    return this.http.patch<SiteSettings>(`${this.apiUrl}${id}/`, formData);
  }

  /**
   * Download logo file (direct download)
   */
  downloadLogo(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}download_logo/`, {
      responseType: 'blob'
    });
  }

  /**
   * Download favicon file (direct download)
   */
  downloadFavicon(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}download_favicon/`, {
      responseType: 'blob'
    });
  }

  /**
   * Get signed URL token for logo download
   */
  getLogoSignedUrl(): Observable<{token: string, filename: string}> {
    return this.http.post<{token: string, filename: string}>(`${this.apiUrl}get_logo_signed_url/`, {});
  }

  /**
   * Get signed URL token for favicon download
   */
  getFaviconSignedUrl(): Observable<{token: string, filename: string}> {
    return this.http.post<{token: string, filename: string}>(`${this.apiUrl}get_favicon_signed_url/`, {});
  }

  /**
   * Download logo using signed token
   */
  downloadLogoSigned(token: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}download_logo_signed/?token=${token}`, {
      responseType: 'blob'
    });
  }

  /**
   * Download favicon using signed token
   */
  downloadFaviconSigned(token: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}download_favicon_signed/?token=${token}`, {
      responseType: 'blob'
    });
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): SiteSettings {
    console.log('Using default site settings');
    return {
      site_name: 'CUPCAKE',
      site_tagline: '',
      banner_enabled: false,
      banner_text: '',
      banner_color: '#0066cc',
      banner_text_color: '#ffffff',
      banner_dismissible: true,
      primary_color: '#0066cc',
      secondary_color: '#6c757d',
      footer_text: ''
    };
  }

  /**
   * Dismiss banner
   */
  dismissBanner(): void {
    localStorage.setItem('banner_dismissed', 'true');
    this.bannerDismissedSubject.next(true);
  }

  /**
   * Reset banner dismissal (for admin testing)
   */
  resetBannerDismissal(): void {
    localStorage.removeItem('banner_dismissed');
    this.bannerDismissedSubject.next(false);
  }

  /**
   * Get current public settings value (synchronous)
   */
  getCurrentPublicSettings(): PublicSiteSettings | null {
    return this.publicSettingsSubject.value;
  }

  /**
   * Apply theme colors to CSS custom properties
   */
  applyThemeColors(settings: PublicSiteSettings): void {
    const root = document.documentElement;
    
    // Set cupcake-specific custom properties
    root.style.setProperty('--cupcake-primary-color', settings.primary_color);
    root.style.setProperty('--cupcake-secondary-color', settings.secondary_color);
    root.style.setProperty('--cupcake-banner-color', settings.banner_color);
    root.style.setProperty('--cupcake-banner-text-color', settings.banner_text_color);
    
    // Override Bootstrap's primary and secondary color variables
    root.style.setProperty('--bs-primary', settings.primary_color);
    root.style.setProperty('--bs-primary-rgb', this.hexToRgb(settings.primary_color));
    root.style.setProperty('--bs-secondary', settings.secondary_color);
    root.style.setProperty('--bs-secondary-rgb', this.hexToRgb(settings.secondary_color));
    
    // Generate lighter and darker variants for Bootstrap
    const primaryDark = this.adjustBrightness(settings.primary_color, -20);
    const primaryLight = this.adjustBrightness(settings.primary_color, 20);
    const secondaryDark = this.adjustBrightness(settings.secondary_color, -20);
    const secondaryLight = this.adjustBrightness(settings.secondary_color, 20);
    
    root.style.setProperty('--bs-primary-dark', primaryDark);
    root.style.setProperty('--bs-primary-light', primaryLight);
    root.style.setProperty('--bs-secondary-dark', secondaryDark);
    root.style.setProperty('--bs-secondary-light', secondaryLight);
  }

  /**
   * Convert hex color to RGB values for Bootstrap RGB variables
   */
  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `${r}, ${g}, ${b}`;
    }
    return '0, 0, 0'; // fallback
  }

  /**
   * Adjust brightness of a hex color
   */
  private adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  /**
   * Update page title and favicon based on settings
   */
  updatePageBranding(settings: PublicSiteSettings): void {
    // Update page title
    document.title = settings.site_name;

    // Update favicon if available
    if (settings.favicon) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = settings.favicon;
      }
    }
  }
}
