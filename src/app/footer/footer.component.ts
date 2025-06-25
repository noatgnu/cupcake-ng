import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteSettingsService } from '../site-settings.service';
import { SiteSettings } from '../site-settings';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit, OnDestroy {
  settings: SiteSettings | null = null;
  private subscription = new Subscription();

  constructor(private siteSettingsService: SiteSettingsService) {}

  ngOnInit(): void {
    // Subscribe to public settings changes
    this.subscription.add(
      this.siteSettingsService.publicSettings$.subscribe(settings => {
        this.settings = settings;
        // Update CSS custom property when footer visibility changes
        this.updateFooterHeight();
      })
    );

    // Load initial settings
    const currentSettings = this.siteSettingsService.getCurrentPublicSettings();
    if (currentSettings) {
      this.settings = currentSettings;
      this.updateFooterHeight();
    }
  }

  private updateFooterHeight(): void {
    // Set CSS custom property based on whether footer is visible
    const footerHeight = this.settings?.footer_text ? '100px' : '0px';
    // Add extra padding to ensure content like instrument booking legends fit properly
    const bodyPadding = this.settings?.footer_text ? '12px' : '20px';

    document.documentElement.style.setProperty('--footer-height', footerHeight);

    // Add padding to body to prevent content from being hidden behind fixed footer
    document.body.style.paddingBottom = bodyPadding;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }
}
