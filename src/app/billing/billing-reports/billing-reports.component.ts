import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SiteSettingsService } from '../../site-settings.service';

@Component({
  selector: 'app-billing-reports',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './billing-reports.component.html',
  styleUrl: './billing-reports.component.scss'
})
export class BillingReportsComponent implements OnInit {
  
  constructor(public siteSettings: SiteSettingsService) { }

  ngOnInit(): void {
  }

  hasFooterText(): boolean {
    const settings = this.siteSettings.getCurrentPublicSettings();
    return !!(settings?.footer_text && settings.footer_text.trim());
  }
}