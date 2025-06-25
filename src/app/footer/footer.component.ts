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
      })
    );

    // Load initial settings
    const currentSettings = this.siteSettingsService.getCurrentPublicSettings();
    if (currentSettings) {
      this.settings = currentSettings;
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }
}