import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { SiteSettingsService } from '../site-settings.service';
import { PublicSiteSettings } from '../site-settings';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  imports: [NgOptimizedImage],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  siteName = 'Cupcake';
  siteTagline = 'Your comprehensive laboratory protocol management and execution platform';
  hasLogo = false;
  baseUrl = environment.baseURL;
  logoUrl: string | null = null;
  
  // Module availability flags
  enableDocuments = true;
  enableLabNotebook = true;
  enableInstruments = true;
  enableStorage = true;
  enableBilling = true;

  constructor(private router: Router, public siteSettings: SiteSettingsService) { }

  hasFooterText(): boolean {
    const settings = this.siteSettings.getCurrentPublicSettings();
    return !!(settings?.footer_text && settings.footer_text.trim());
  }

  ngOnInit(): void {
    this.siteSettings.publicSettings$.subscribe((settings: PublicSiteSettings | null) => {
      if (settings) {
        if (settings.site_name) {
          this.siteName = settings.site_name;
        }
        if (settings.site_tagline) {
          this.siteTagline = settings.site_tagline;
        }
        if (settings.logo) {
          this.hasLogo = true;
          this.logoUrl = `${this.baseUrl}/api/site_settings/download_logo/`;
        } else {
          this.hasLogo = false;
          this.logoUrl = null;
        }
        
        // Update module availability based on settings
        this.enableDocuments = settings.enable_documents_module;
        this.enableLabNotebook = settings.enable_lab_notebook_module;
        this.enableInstruments = settings.enable_instruments_module;
        this.enableStorage = settings.enable_storage_module;
        this.enableBilling = settings.enable_billing_module;
      }
    });
  }

  onImageError(event: any) {
    console.error('Logo failed to load:', event);
    console.log('Failed URL:', this.logoUrl);
    // Try with a cache-busting parameter
    if (this.logoUrl && !this.logoUrl.includes('?')) {
      this.logoUrl = `${this.logoUrl}?t=${Date.now()}`;
      console.log('Retrying with cache-busting URL:', this.logoUrl);
    } else {
      // If it still fails, hide the logo
      this.hasLogo = false;
      this.logoUrl = null;
    }
  }

  onImageLoad(event: any) {
    console.log('Logo loaded successfully:', event);
  }

  navigateToNotebook() {
    this.router.navigate(['/laboratory-notebook']);
  }

  navigateToDocuments() {
    this.router.navigate(['/documents']);
  }

  navigateToInstruments() {
    this.router.navigate(['/instruments']);
  }

  navigateToReagentStore() {
    this.router.navigate(['/reagent-store']);
  }


  navigateToAccounts() {
    this.router.navigate(['/accounts']);
  }

  navigateToMetadataPlayground() {
    this.router.navigate(['/metadata-playground']);
  }

  navigateToBilling() {
    this.router.navigate(['/billing']);
  }
}
