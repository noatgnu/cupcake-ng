import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgClass } from '@angular/common';
import { BillingService, PricingDisplay } from '../billing.service';
import { WebService } from '../../web.service';
import { DataService } from '../../data.service';
import { AccountsService } from '../../accounts/accounts.service';
import { LabGroup } from '../../lab-group';
import { User } from '../../user';
import { SiteSettingsService } from '../../site-settings.service';

@Component({
  selector: 'app-billing-dashboard',
  imports: [RouterModule, NgClass],
  templateUrl: './billing-dashboard.component.html',
  styleUrl: './billing-dashboard.component.scss'
})
export class BillingDashboardComponent implements OnInit {
  loading = false;
  dashboardData: {
    pricing?: PricingDisplay['pricing_display'];
  } = {};
  userRole = 'user'; // 'user' | 'admin' | 'core_facility'
  
  constructor(
    private router: Router,
    private billingService: BillingService,
    private webService: WebService,
    public dataService: DataService,
    private accountsService: AccountsService,
    public siteSettings: SiteSettingsService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
    this.checkUserRole();
  }

  loadDashboardData() {
    this.loading = true;
    
    // Load basic dashboard statistics
    this.billingService.getPricingDisplay().subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboardData.pricing = response.pricing_display;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
      }
    });
  }

  checkUserRole() {
    // Check if user has core facility permissions
    this.accountsService.getCurrentUser().subscribe({
      next: (user) => {
        if (user.is_staff) {
          this.userRole = 'admin';
        } else if (user.lab_groups?.some((group: LabGroup) => group.is_core_facility)) {
          this.userRole = 'core_facility';
        } else {
          this.userRole = 'user';
        }
      },
      error: (error) => {
        console.error('Error checking user role:', error);
      }
    });
  }

  getQuickStats() {
    if (!this.dashboardData.pricing) return {};
    
    return {
      totalInstruments: this.dashboardData.pricing.instruments?.length || 0,
      totalServiceTiers: this.dashboardData.pricing.service_tiers?.length || 0,
      totalLabGroups: this.dashboardData.pricing.lab_group ? 1 : 0
    };
  }

  navigateToPricing() {
    this.router.navigate(['/billing/pricing']);
  }

  navigateToManagement() {
    this.router.navigate(['/billing/management']);
  }

  navigateToReports() {
    this.router.navigate(['/billing/reports']);
  }

  hasFooterText(): boolean {
    const settings = this.siteSettings.getCurrentPublicSettings();
    return !!(settings?.footer_text && settings.footer_text.trim());
  }
}