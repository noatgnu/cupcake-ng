import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteSettingsService } from '../site-settings.service';
import {PublicSiteSettings, SiteSettings} from '../site-settings';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit, OnDestroy {
  settings: PublicSiteSettings | null = null;
  private subscription = new Subscription();
  
  // Footer state management
  isVisible = true;
  isCollapsed = false;
  private collapseTimeout: any;
  private autoHideTimeout: any;
  
  @HostBinding('class.footer-hidden')
  get footerHidden() {
    return !this.isVisible || !this.settings?.footer_text;
  }

  constructor(private siteSettingsService: SiteSettingsService) {
    // Check if footer was previously hidden by user
    const footerHidden = localStorage.getItem('footer-hidden');
    if (footerHidden === 'true') {
      this.isVisible = false;
    }
  }

  ngOnInit(): void {
    // Subscribe to public settings changes
    this.subscription.add(
      this.siteSettingsService.publicSettings$.subscribe(settings => {
        this.settings = settings;
        // Update CSS custom property when footer visibility changes
        this.updateFooterHeight();
        
        // Auto-collapse after 5 seconds if footer has text
        if (settings?.footer_text) {
          this.scheduleAutoCollapse();
        }
      })
    );

    // Load initial settings
    const currentSettings: PublicSiteSettings|null = this.siteSettingsService.getCurrentPublicSettings();
    if (currentSettings) {
      this.settings = currentSettings;
      this.updateFooterHeight();
      
      // Auto-collapse after 5 seconds if footer has text
      if (currentSettings?.footer_text) {
        this.scheduleAutoCollapse();
      }
    }
  }

  private updateFooterHeight(): void {
    // Set CSS custom property based on whether footer is visible and expanded
    const hasFooter = this.settings?.footer_text && this.isVisible;
    const footerHeight = hasFooter ? (this.isCollapsed ? '4px' : '40px') : '0px';
    // Minimal padding when footer is collapsed or hidden
    const bodyPadding = hasFooter && !this.isCollapsed ? '8px' : '4px';

    document.documentElement.style.setProperty('--footer-height', footerHeight);
    document.body.style.paddingBottom = bodyPadding;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.clearTimeouts();
  }
  
  private clearTimeouts(): void {
    if (this.collapseTimeout) {
      clearTimeout(this.collapseTimeout);
    }
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
    }
  }
  
  scheduleAutoCollapse(): void {
    this.clearTimeouts();
    this.autoHideTimeout = setTimeout(() => {
      this.isCollapsed = true;
      this.updateFooterHeight();
    }, 5000); // Auto-collapse after 5 seconds
  }
  
  expandFooter(): void {
    this.clearTimeouts();
    this.isCollapsed = false;
    this.updateFooterHeight();
  }
  
  scheduleCollapse(): void {
    this.collapseTimeout = setTimeout(() => {
      this.isCollapsed = true;
      this.updateFooterHeight();
    }, 2000); // Collapse 2 seconds after mouse leaves
  }
  
  hideFooter(): void {
    this.isVisible = false;
    this.updateFooterHeight();
    
    // Store preference in localStorage
    localStorage.setItem('footer-hidden', 'true');
  }
  
  // Method to restore footer (can be called from other components)
  showFooter(): void {
    this.isVisible = true;
    this.isCollapsed = false;
    this.updateFooterHeight();
    this.scheduleAutoCollapse();
    
    // Remove preference from localStorage
    localStorage.removeItem('footer-hidden');
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }
}
