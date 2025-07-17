import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { BillingService, QuoteRequest, QuoteResponse } from '../billing.service';
import { WebService } from '../../web.service';
import { InstrumentService } from '../../instrument.service';
import { LabGroup, LabGroupQuery } from '../../lab-group';
import { Instrument, InstrumentQuery } from '../../instrument';

@Component({
  selector: 'app-quote-request-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbTooltip],
  templateUrl: './quote-request-modal.component.html',
  styleUrl: './quote-request-modal.component.scss'
})
export class QuoteRequestModalComponent implements OnInit {
  @Input() preselectedInstrument?: number;
  @Input() preselectedServiceTier?: number;

  quoteForm: FormGroup;
  formConfig: {
    success: boolean;
    form_config: {
      instruments: Instrument[];
      lab_groups: LabGroup[];
      service_tiers: any[];
    };
  } | null = null;
  loading = false;
  submitting = false;
  error: string | null = null;
  quote: QuoteResponse['quote'] | null = null;

  constructor(
    private fb: FormBuilder,
    private billingService: BillingService,
    private webService: WebService,
    private instrumentService: InstrumentService,
    public activeModal: NgbActiveModal
  ) {
    this.quoteForm = this.fb.group({
      instrument_id: [null, Validators.required],
      service_tier_id: [null, Validators.required],
      samples: [1, [Validators.required, Validators.min(1)]],
      injections_per_sample: [1, [Validators.min(1)]],
      estimated_instrument_hours: [null, [Validators.min(0)]],
      estimated_personnel_hours: [null, [Validators.min(0)]],
      contact_email: ['', [Validators.email]],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadFormConfig();
  }

  loadFormConfig() {
    this.loading = true;
    this.error = null;

    // Load form configuration using established services
    Promise.all([
      this.instrumentService.getInstruments().toPromise(),
      this.webService.getLabGroups('', 100, 0, undefined, true).toPromise()
    ]).then(([instrumentsResponse, labGroupsResponse]: [InstrumentQuery | undefined, LabGroupQuery | undefined]) => {
      this.formConfig = {
        success: true,
        form_config: {
          instruments: instrumentsResponse?.results.filter(i => i.enabled) || [],
          lab_groups: labGroupsResponse?.results || [],
          service_tiers: [] // Will be populated based on selected lab group
        }
      };
      this.setupForm();
      this.loading = false;
    }).catch((error) => {
      console.error('Error loading form config:', error);
      this.error = 'Failed to load form configuration';
      this.loading = false;
    });
  }

  setupForm() {
    if (this.preselectedInstrument) {
      this.quoteForm.patchValue({ instrument_id: this.preselectedInstrument });
    }
    if (this.preselectedServiceTier) {
      this.quoteForm.patchValue({ service_tier_id: this.preselectedServiceTier });
    }
  }

  onInstrumentChange() {
    // Clear service tier when instrument changes
    this.quoteForm.patchValue({ service_tier_id: null });
  }

  onServiceTierChange() {
    // Optional: Load pricing options for selected combination
    const instrumentId = this.quoteForm.get('instrument_id')?.value;
    const serviceTierId = this.quoteForm.get('service_tier_id')?.value;
    
    if (instrumentId && serviceTierId) {
      this.loadPricingOptions(instrumentId, serviceTierId);
    }
  }

  loadPricingOptions(instrumentId: number, serviceTierId: number) {
    this.billingService.getPricingOptions(instrumentId, serviceTierId).subscribe({
      next: (response) => {
        if (response.success) {
          // Update form with available pricing options
          console.log('Pricing options:', response.pricing_options);
        }
      },
      error: (error) => {
        console.error('Error loading pricing options:', error);
      }
    });
  }

  generateQuote() {
    if (this.quoteForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    this.error = null;

    const quoteRequest: QuoteRequest = this.quoteForm.value;

    this.billingService.generateQuote(quoteRequest).subscribe({
      next: (response) => {
        if (response.success) {
          this.quote = response.quote || null;
        } else {
          this.error = response.error || 'Failed to generate quote';
        }
        this.submitting = false;
      },
      error: (error) => {
        console.error('Error generating quote:', error);
        this.error = 'Failed to generate quote';
        this.submitting = false;
      }
    });
  }

  markFormGroupTouched() {
    Object.keys(this.quoteForm.controls).forEach(key => {
      this.quoteForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.quoteForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['min'].min}`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
    }
    return null;
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'instrument_id': 'Instrument',
      'service_tier_id': 'Service Tier',
      'samples': 'Number of Samples',
      'injections_per_sample': 'Injections per Sample',
      'estimated_instrument_hours': 'Estimated Instrument Hours',
      'estimated_personnel_hours': 'Estimated Personnel Hours',
      'contact_email': 'Contact Email',
      'notes': 'Notes'
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

  downloadQuote() {
    if (!this.quote) return;

    // Create a simple text version of the quote
    const quoteText = this.generateQuoteText();
    const blob = new Blob([quoteText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quote-${this.quote.instrument.name}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  generateQuoteText(): string {
    if (!this.quote) return '';

    let text = `SERVICE QUOTE\n`;
    text += `Generated: ${this.formatDate(this.quote.generated_at)}\n`;
    text += `Valid Until: ${this.formatDate(this.quote.valid_until)}\n\n`;
    
    text += `INSTRUMENT: ${this.quote.instrument.name}\n`;
    text += `SERVICE TIER: ${this.quote.service_tier.name}\n\n`;
    
    text += `LINE ITEMS:\n`;
    text += `${'Description'.padEnd(40)} ${'Qty'.padEnd(10)} ${'Unit Price'.padEnd(15)} ${'Total'.padEnd(15)}\n`;
    text += `${'-'.repeat(80)}\n`;
    
    for (const item of this.quote.line_items) {
      text += `${item.description.padEnd(40)} ${item.quantity.toString().padEnd(10)} ${this.formatPrice(item.unit_price).padEnd(15)} ${this.formatPrice(item.total_price).padEnd(15)}\n`;
    }
    
    text += `${'-'.repeat(80)}\n`;
    text += `${'TOTAL'.padEnd(40)} ${' '.repeat(10)} ${' '.repeat(15)} ${this.formatPrice(this.quote.total).padEnd(15)}\n`;
    
    return text;
  }

  close() {
    this.activeModal.close();
  }

  acceptQuote() {
    this.activeModal.close({ success: true, quote: this.quote });
  }
}