import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbTooltip, NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { BillingService, ServiceTier, ServicePrice, PricingSummary } from '../billing.service';
import { WebService } from '../../web.service';
import { InstrumentService } from '../../instrument.service';
import { LabGroup, LabGroupQuery } from '../../lab-group';
import { Instrument, InstrumentQuery } from '../../instrument';
import { ToastService } from '../../toast.service';
import { AreYouSureModalComponent } from '../../are-you-sure-modal/are-you-sure-modal.component';
import { SiteSettingsService } from '../../site-settings.service';

@Component({
  selector: 'app-billing-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    NgbTooltip, 
    NgbCollapse
  ],
  templateUrl: './billing-management.component.html',
  styleUrl: './billing-management.component.scss'
})
export class BillingManagementComponent implements OnInit {
  pricingSummary?: PricingSummary['pricing_summary'];
  selectedLabGroup?: number;
  labGroups: LabGroup[] = [];
  loading = false;
  error: string | null = null;

  // Service tier management
  serviceTiers: ServiceTier[] = [];
  serviceTierForm: FormGroup;
  showServiceTierForm = false;
  editingServiceTier?: ServiceTier;

  // Service price management
  servicePrices: ServicePrice[] = [];
  servicePriceForm: FormGroup;
  showServicePriceForm = false;
  editingServicePrice?: ServicePrice;

  // Bulk editing
  bulkEditMode = false;
  bulkEditPrices: any[] = [];

  // Accordion collapse states
  isServiceTiersCollapsed = false;
  isServicePricesCollapsed = true;
  isBulkEditCollapsed = true;

  // Form data
  instruments: Instrument[] = [];
  billingUnits = [
    { value: 'per_sample', display: 'Per Sample' },
    { value: 'per_hour_instrument', display: 'Per Hour - Instrument Time' },
    { value: 'per_hour_personnel', display: 'Per Hour - Personnel Time' },
    { value: 'per_injection', display: 'Per Injection' },
    { value: 'flat_rate', display: 'Flat Rate' }
  ];

  constructor(
    private fb: FormBuilder,
    private billingService: BillingService,
    private webService: WebService,
    private instrumentService: InstrumentService,
    private toastService: ToastService,
    private modalService: NgbModal,
    public siteSettings: SiteSettingsService
  ) {
    this.serviceTierForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      lab_group: [null, Validators.required],
      is_active: [true]
    });

    this.servicePriceForm = this.fb.group({
      service_tier: [null, Validators.required],
      instrument: [null, Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
      billing_unit: ['', Validators.required],
      currency: ['USD', Validators.required],
      effective_date: [new Date().toISOString().split('T')[0], Validators.required],
      expiry_date: [''],
      is_active: [true]
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loadLabGroups();
    this.loadInstruments();
    this.loadServiceTiers();
    this.loadServicePrices();
    this.loadPricingSummary();
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

  loadInstruments() {
    // Use established InstrumentService to get bookable instruments
    this.instrumentService.getInstruments(undefined, 100, 0, "", "", true).subscribe({
      next: (response: InstrumentQuery) => {
        // Filter for enabled instruments only
        this.instruments = response.results.filter(instrument => instrument.enabled);
      },
      error: (error) => {
        console.error('Error loading instruments:', error);
        // Fallback to empty array if error
        this.instruments = [];
      }
    });
  }

  loadServiceTiers() {
    this.billingService.getServiceTiers().subscribe({
      next: (response: any) => {
        console.log('Service tiers response:', response);
        // Handle both direct array and paginated response
        if (Array.isArray(response)) {
          this.serviceTiers = response;
        } else if (response && response.results && Array.isArray(response.results)) {
          this.serviceTiers = response.results;
        } else {
          console.warn('Unexpected service tiers response format:', response);
          this.serviceTiers = [];
        }
      },
      error: (error) => {
        console.error('Error loading service tiers:', error);
        this.serviceTiers = [];
      }
    });
  }

  loadServicePrices() {
    this.billingService.getServicePrices().subscribe({
      next: (response: any) => {
        console.log('Service prices response:', response);
        // Handle both direct array and paginated response
        if (Array.isArray(response)) {
          this.servicePrices = response;
        } else if (response && response.results && Array.isArray(response.results)) {
          this.servicePrices = response.results;
        } else {
          console.warn('Unexpected service prices response format:', response);
          this.servicePrices = [];
        }
      },
      error: (error) => {
        console.error('Error loading service prices:', error);
        this.servicePrices = [];
      }
    });
  }

  loadPricingSummary() {
    this.loading = true;
    this.error = null;

    this.billingService.getPricingSummary(this.selectedLabGroup).subscribe({
      next: (response) => {
        if (response.success) {
          this.pricingSummary = response.pricing_summary;
        } else {
          this.error = response.error || 'Failed to load pricing summary';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading pricing summary:', error);
        this.error = 'Failed to load pricing summary';
        this.loading = false;
      }
    });
  }

  onLabGroupChange() {
    this.loadPricingSummary();
  }

  // Service Tier Management
  showAddServiceTierForm() {
    this.editingServiceTier = undefined;
    this.serviceTierForm.reset();
    this.serviceTierForm.patchValue({
      is_active: true,
      lab_group: this.selectedLabGroup
    });
    this.showServiceTierForm = true;
  }

  editServiceTier(tier: ServiceTier) {
    this.editingServiceTier = tier;
    this.serviceTierForm.patchValue({
      name: tier.name,
      description: tier.description,
      lab_group: tier.lab_group,
      is_active: tier.is_active
    });
    this.showServiceTierForm = true;
  }

  saveServiceTier() {
    if (this.serviceTierForm.invalid) {
      this.markFormGroupTouched(this.serviceTierForm);
      return;
    }

    const formData = this.serviceTierForm.value;

    if (this.editingServiceTier) {
      // Update existing service tier
      this.billingService.updateServiceTier(this.editingServiceTier.id, formData).subscribe({
        next: (updatedTier) => {
          const index = this.serviceTiers.findIndex(t => t.id === updatedTier.id);
          if (index !== -1) {
            this.serviceTiers[index] = updatedTier;
          }
          this.toastService.show('Service tier updated successfully!', 'success');
          this.cancelServiceTierForm();
          this.loadPricingSummary();
        },
        error: (error) => {
          console.error('Error updating service tier:', error);
          this.toastService.show('Failed to update service tier', 'error');
        }
      });
    } else {
      // Create new service tier
      this.billingService.createServiceTierDirect(formData).subscribe({
        next: (newTier) => {
          this.serviceTiers.push(newTier);
          this.toastService.show('Service tier created successfully!', 'success');
          this.cancelServiceTierForm();
          this.loadPricingSummary();
        },
        error: (error) => {
          console.error('Error creating service tier:', error);
          this.toastService.show('Failed to create service tier', 'error');
        }
      });
    }
  }

  deleteServiceTier(tier: ServiceTier) {
    const modalRef = this.modalService.open(AreYouSureModalComponent);
    modalRef.componentInstance.title = 'Delete Service Tier';
    modalRef.componentInstance.message = `Are you sure you want to delete the service tier "${tier.name}"? This action cannot be undone.`;
    modalRef.componentInstance.confirmText = 'Delete';
    modalRef.componentInstance.confirmClass = 'btn-danger';

    modalRef.result.then((result) => {
      if (result) {
        this.billingService.deleteServiceTier(tier.id).subscribe({
          next: () => {
            this.serviceTiers = this.serviceTiers.filter(t => t.id !== tier.id);
            this.toastService.show('Service tier deleted successfully!', 'success');
            this.loadPricingSummary();
          },
          error: (error) => {
            console.error('Error deleting service tier:', error);
            this.toastService.show('Failed to delete service tier', 'error');
          }
        });
      }
    }).catch(() => {});
  }

  cancelServiceTierForm() {
    this.showServiceTierForm = false;
    this.editingServiceTier = undefined;
    this.serviceTierForm.reset();
  }

  // Service Price Management
  showAddServicePriceForm() {
    this.editingServicePrice = undefined;
    this.servicePriceForm.reset();
    this.servicePriceForm.patchValue({
      currency: 'USD',
      effective_date: new Date().toISOString().split('T')[0],
      is_active: true
    });
    this.showServicePriceForm = true;
  }

  editServicePrice(price: ServicePrice) {
    this.editingServicePrice = price;
    this.servicePriceForm.patchValue({
      service_tier: price.service_tier,
      instrument: price.instrument,
      price: price.price,
      billing_unit: price.billing_unit,
      currency: price.currency,
      effective_date: price.effective_date,
      expiry_date: price.expiry_date,
      is_active: price.is_active
    });
    this.showServicePriceForm = true;
  }

  saveServicePrice() {
    if (this.servicePriceForm.invalid) {
      this.markFormGroupTouched(this.servicePriceForm);
      return;
    }

    const formData = this.servicePriceForm.value;

    if (this.editingServicePrice) {
      // Update existing service price
      this.billingService.updateServicePrice(this.editingServicePrice.id, formData).subscribe({
        next: (updatedPrice) => {
          const index = this.servicePrices.findIndex(p => p.id === updatedPrice.id);
          if (index !== -1) {
            this.servicePrices[index] = updatedPrice;
          }
          this.toastService.show('Service price updated successfully!', 'success');
          this.cancelServicePriceForm();
          this.loadPricingSummary();
        },
        error: (error) => {
          console.error('Error updating service price:', error);
          this.toastService.show('Failed to update service price', 'error');
        }
      });
    } else {
      // Create new service price
      this.billingService.createServicePriceDirect(formData).subscribe({
        next: (newPrice) => {
          this.servicePrices.push(newPrice);
          this.toastService.show('Service price created successfully!', 'success');
          this.cancelServicePriceForm();
          this.loadPricingSummary();
        },
        error: (error) => {
          console.error('Error creating service price:', error);
          this.toastService.show('Failed to create service price', 'error');
        }
      });
    }
  }

  deleteServicePrice(price: ServicePrice) {
    const modalRef = this.modalService.open(AreYouSureModalComponent);
    modalRef.componentInstance.title = 'Delete Service Price';
    modalRef.componentInstance.message = `Are you sure you want to delete this service price? This action cannot be undone.`;
    modalRef.componentInstance.confirmText = 'Delete';
    modalRef.componentInstance.confirmClass = 'btn-danger';

    modalRef.result.then((result) => {
      if (result) {
        this.billingService.deleteServicePrice(price.id).subscribe({
          next: () => {
            this.servicePrices = this.servicePrices.filter(p => p.id !== price.id);
            this.toastService.show('Service price deleted successfully!', 'success');
            this.loadPricingSummary();
          },
          error: (error) => {
            console.error('Error deleting service price:', error);
            this.toastService.show('Failed to delete service price', 'error');
          }
        });
      }
    }).catch(() => {});
  }

  cancelServicePriceForm() {
    this.showServicePriceForm = false;
    this.editingServicePrice = undefined;
    this.servicePriceForm.reset();
  }

  // Bulk Edit Mode
  enterBulkEditMode() {
    this.bulkEditMode = true;
    this.bulkEditPrices = this.servicePrices.map(price => ({
      id: price.id,
      service_tier_name: price.service_tier_name,
      instrument_name: price.instrument_name,
      billing_unit: price.billing_unit,
      price: price.price,
      currency: price.currency,
      is_active: price.is_active,
      originalPrice: price.price
    }));
  }

  exitBulkEditMode() {
    this.bulkEditMode = false;
    this.bulkEditPrices = [];
  }

  saveBulkEdits() {
    if (!this.selectedLabGroup) {
      this.toastService.show('Please select a lab group first', 'error');
      return;
    }

    // Filter only changed prices
    const priceUpdates = this.bulkEditPrices
      .filter(price => price.price !== price.originalPrice)
      .map(price => ({
        id: price.id,
        price: price.price,
        is_active: price.is_active
      }));

    if (priceUpdates.length === 0) {
      this.toastService.show('No changes detected', 'info');
      return;
    }

    this.billingService.bulkUpdatePrices(this.selectedLabGroup, priceUpdates).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.show(`${response.updated_count} prices updated successfully!`, 'success');
          this.exitBulkEditMode();
          this.loadServicePrices();
          this.loadPricingSummary();
        } else {
          this.toastService.show(response.error || 'Failed to update prices', 'error');
        }
      },
      error: (error) => {
        console.error('Error updating prices:', error);
        this.toastService.show('Failed to update prices', 'error');
      }
    });
  }

  // Utility methods
  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string | null {
    const field = formGroup.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['min'].min}`;
      }
    }
    return null;
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'name': 'Name',
      'description': 'Description',
      'lab_group': 'Lab Group',
      'service_tier': 'Service Tier',
      'instrument': 'Instrument',
      'price': 'Price',
      'billing_unit': 'Billing Unit',
      'currency': 'Currency',
      'effective_date': 'Effective Date',
      'expiry_date': 'Expiry Date'
    };
    return labels[fieldName] || fieldName;
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

  getServiceTierById(id: number): ServiceTier | undefined {
    return this.serviceTiers.find(tier => tier.id === id);
  }

  getInstrumentById(id: number): Instrument | undefined {
    return this.instruments.find(instrument => instrument.id === id);
  }

  getLabGroupById(id: number): LabGroup | undefined {
    return this.labGroups.find(group => group.id === id);
  }

  refreshData() {
    this.loadData();
  }

  hasFooterText(): boolean {
    const settings = this.siteSettings.getCurrentPublicSettings();
    return !!(settings?.footer_text && settings.footer_text.trim());
  }
}