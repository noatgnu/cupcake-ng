import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { BillingDashboardComponent } from './billing-dashboard/billing-dashboard.component';
import { PublicPricingDisplayComponent } from './public-pricing-display/public-pricing-display.component';
import { BillingManagementComponent } from './billing-management/billing-management.component';
import { BillingReportsComponent } from './billing-reports/billing-reports.component';

const routes: Routes = [
  {
    path: '',
    component: BillingDashboardComponent
  },
  {
    path: 'pricing',
    component: PublicPricingDisplayComponent
  },
  {
    path: 'management',
    component: BillingManagementComponent
  },
  {
    path: 'reports',
    component: BillingReportsComponent
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class BillingModule { }