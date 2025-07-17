import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicPricingDisplayComponent } from './public-pricing-display/public-pricing-display.component';
import { BillingManagementComponent } from './billing-management/billing-management.component';
import { BillingDashboardComponent } from './billing-dashboard/billing-dashboard.component';
import { BillingReportsComponent } from './billing-reports/billing-reports.component';

const routes: Routes = [
  {
    path: '',
    component: BillingDashboardComponent,
    data: { title: 'Billing Dashboard' }
  },
  {
    path: 'pricing',
    component: PublicPricingDisplayComponent,
    data: { title: 'Service Pricing' }
  },
  {
    path: 'management',
    component: BillingManagementComponent,
    data: { title: 'Billing Management' }
  },
  {
    path: 'reports',
    component: BillingReportsComponent,
    data: { title: 'Billing Reports' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BillingRoutingModule { }