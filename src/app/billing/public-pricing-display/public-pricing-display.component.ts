import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbTooltip, NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { BillingService, PricingDisplay, QuoteRequest, QuoteResponse } from '../billing.service';
import { WebService } from '../../web.service';
import { LabGroup, LabGroupQuery } from '../../lab-group';
import { ToastService } from '../../toast.service';
import { QuoteRequestModalComponent } from '../quote-request-modal/quote-request-modal.component';
import { SiteSettingsService } from '../../site-settings.service';

@Component({
  selector: 'app-public-pricing-display',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    NgbTooltip, 
    NgbCollapse
  ],
  templateUrl: './public-pricing-display.component.html',
  styleUrl: './public-pricing-display.component.scss'
})
export class PublicPricingDisplayComponent implements OnInit {
  pricingDisplay?: PricingDisplay['pricing_display'];
  selectedLabGroup?: number;
  labGroups: LabGroup[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private billingService: BillingService,
    private webService: WebService,
    private toastService: ToastService,
    private modalService: NgbModal,
    public siteSettings: SiteSettingsService
  ) {}

  // Track collapse state for each service tier
  tierCollapseStates: { [key: string]: boolean } = {};

  getTierCollapseState(tierId: number): boolean {
    return this.tierCollapseStates[`tier-${tierId}`] || false;
  }

  toggleTierCollapse(tierId: number): void {
    const key = `tier-${tierId}`;
    this.tierCollapseStates[key] = !this.tierCollapseStates[key];
  }

  ngOnInit() {
    this.loadLabGroups();
    this.loadPricingDisplay();
  }

  loadLabGroups() {
    // Use established WebService method with proper parameters for core facilities
    this.webService.getLabGroups('', 100, 0, undefined, true).subscribe({
      next: (response: LabGroupQuery) => {
        this.labGroups = response.results;
      },
      error: (error) => {
        console.error('Error loading lab groups:', error);
        this.labGroups = [];
      }
    });
  }

  loadPricingDisplay() {
    this.loading = true;
    this.error = null;

    this.billingService.getPricingDisplay(this.selectedLabGroup).subscribe({
      next: (response) => {
        if (response.success) {
          this.pricingDisplay = response.pricing_display;
        } else {
          this.error = response.error || 'Failed to load pricing display';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading pricing display:', error);
        this.error = 'Failed to load pricing display';
        this.loading = false;
      }
    });
  }

  onLabGroupChange() {
    this.loadPricingDisplay();
  }

  formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  openQuoteModal(instrumentId?: number, serviceTierId?: number) {
    const modalRef = this.modalService.open(QuoteRequestModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });

    if (instrumentId) {
      modalRef.componentInstance.preselectedInstrument = instrumentId;
    }
    if (serviceTierId) {
      modalRef.componentInstance.preselectedServiceTier = serviceTierId;
    }

    modalRef.result.then((result) => {
      if (result && result.success) {
        this.toastService.show('Quote generated successfully!', 'success');
        // Optionally show quote details or download
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  getBillingUnitDescription(billingUnit: string): string {
    const descriptions: { [key: string]: string } = {
      'per_sample': 'Price charged per sample analyzed',
      'per_hour_instrument': 'Price charged per hour of instrument time',
      'per_hour_personnel': 'Price charged per hour of personnel time',
      'per_injection': 'Price charged per injection',
      'flat_rate': 'Fixed price regardless of usage'
    };
    return descriptions[billingUnit] || billingUnit;
  }

  getServiceTierColor(index: number): string {
    const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'danger'];
    return colors[index % colors.length];
  }

  getPriceRangeText(instrument: NonNullable<PricingDisplay['pricing_display']>['instruments'][0]): string {
    const min = this.formatPrice(instrument.price_range.min_price, instrument.price_range.currency);
    const max = this.formatPrice(instrument.price_range.max_price, instrument.price_range.currency);
    
    if (instrument.price_range.min_price === instrument.price_range.max_price) {
      return min;
    }
    
    return `${min} - ${max}`;
  }

  getTierCount(instrument: NonNullable<PricingDisplay['pricing_display']>['instruments'][0]): string {
    const count = instrument.available_tiers;
    return count === 1 ? '1 tier' : `${count} tiers`;
  }

  refreshPricing() {
    this.loadPricingDisplay();
  }

  hasFooterText(): boolean {
    const settings = this.siteSettings.getCurrentPublicSettings();
    return !!(settings?.footer_text && settings.footer_text.trim());
  }
}