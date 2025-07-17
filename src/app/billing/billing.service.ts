import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from "../../environments/environment";

export interface ServiceTier {
  id: number;
  name: string;
  description: string;
  lab_group: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServicePrice {
  id: number;
  service_tier: number;
  service_tier_name: string;
  instrument: number;
  instrument_name: string;
  price: number;
  billing_unit: string;
  billing_unit_display: string;
  currency: string;
  effective_date: string;
  expiry_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillingRecord {
  id: number;
  user: number;
  user_name: string;
  instrument_job: number;
  service_tier: number;
  service_tier_name: string;
  instrument_hours?: number;
  instrument_rate?: number;
  instrument_cost?: number;
  personnel_hours?: number;
  personnel_rate?: number;
  personnel_cost?: number;
  other_quantity?: number;
  other_rate?: number;
  other_cost?: number;
  other_description?: string;
  total_amount: number;
  status: string;
  billing_date: string;
  paid_date?: string;
  invoice_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteRequest {
  instrument_id: number;
  service_tier_id: number;
  samples: number;
  injections_per_sample?: number;
  estimated_instrument_hours?: number;
  estimated_personnel_hours?: number;
  contact_email?: string;
  notes?: string;
  [key: string]: any;
}

export interface QuoteResponse {
  success: boolean;
  quote?: {
    instrument: {
      id: number;
      name: string;
      description: string;
    };
    service_tier: {
      id: number;
      name: string;
      description: string;
    };
    line_items: Array<{
      type: string;
      description: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      billing_unit: string;
    }>;
    subtotal: number;
    total: number;
    currency: string;
    valid_until: string;
    generated_at: string;
  };
  error?: string;
}

export interface PricingDisplay {
  success: boolean;
  pricing_display?: {
    lab_group: {
      id: number;
      name: string;
      description: string;
    };
    service_tiers: Array<{
      id: number;
      name: string;
      description: string;
      instruments: Array<{
        id: number;
        name: string;
        description: string;
        pricing: Array<{
          billing_unit: string;
          billing_unit_display: string;
          price: number;
          currency: string;
        }>;
      }>;
    }>;
    instruments: Array<{
      id: number;
      name: string;
      description: string;
      price_range: {
        min_price: number;
        max_price: number;
        currency: string;
      };
      available_tiers: number;
    }>;
    last_updated: string;
  };
  error?: string;
}

export interface PricingSummary {
  success: boolean;
  pricing_summary?: {
    lab_group: {
      id: number;
      name: string;
      description: string;
    };
    service_tiers: Array<{
      id: number;
      name: string;
      description: string;
      pricing_count: number;
    }>;
    instruments: Array<{
      id: number;
      name: string;
      description: string;
      pricing_count: number;
    }>;
    total_pricing_entries: number;
  };
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private baseUrl = environment.baseURL + "/api";

  constructor(private http: HttpClient) {}

  // Public pricing endpoints
  getPricingDisplay(labGroupId?: number): Observable<PricingDisplay> {
    let params = new HttpParams();
    if (labGroupId) {
      params = params.set('lab_group_id', labGroupId.toString());
    }
    return this.http.get<PricingDisplay>(`${this.baseUrl}/public_pricing/pricing_display/`, { params });
  }

  getQuoteFormConfig(labGroupId?: number): Observable<any> {
    let params = new HttpParams();
    if (labGroupId) {
      params = params.set('lab_group_id', labGroupId.toString());
    }
    return this.http.get<any>(`${this.baseUrl}/public_pricing/quote_form_config/`, { params });
  }

  generateQuote(quoteRequest: QuoteRequest): Observable<QuoteResponse> {
    return this.http.post<QuoteResponse>(`${this.baseUrl}/public_pricing/generate_quote/`, quoteRequest);
  }

  getPricingOptions(instrumentId: number, serviceTierId: number): Observable<any> {
    let params = new HttpParams()
      .set('instrument_id', instrumentId.toString())
      .set('service_tier_id', serviceTierId.toString());
    return this.http.get<any>(`${this.baseUrl}/public_pricing/pricing_options/`, { params });
  }

  // Billing management endpoints (for core facility staff)
  getPricingSummary(labGroupId?: number): Observable<PricingSummary> {
    let params = new HttpParams();
    if (labGroupId) {
      params = params.set('lab_group_id', labGroupId.toString());
    }
    return this.http.get<PricingSummary>(`${this.baseUrl}/billing_management/pricing_summary/`, { params });
  }

  createServiceTier(labGroupId: number, name: string, description: string = ''): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/billing_management/create_service_tier/`, {
      lab_group_id: labGroupId,
      name: name,
      description: description
    });
  }

  createServicePrice(
    labGroupId: number,
    serviceTierId: number,
    instrumentId: number,
    price: number,
    billingUnit: string,
    currency: string = 'USD',
    effectiveDate?: string,
    expiryDate?: string
  ): Observable<any> {
    const data: any = {
      lab_group_id: labGroupId,
      service_tier_id: serviceTierId,
      instrument_id: instrumentId,
      price: price,
      billing_unit: billingUnit,
      currency: currency
    };

    if (effectiveDate) {
      data.effective_date = effectiveDate;
    }
    if (expiryDate) {
      data.expiry_date = expiryDate;
    }

    return this.http.post<any>(`${this.baseUrl}/billing_management/create_service_price/`, data);
  }

  bulkUpdatePrices(labGroupId: number, priceUpdates: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/billing_management/bulk_update_prices/`, {
      lab_group_id: labGroupId,
      price_updates: priceUpdates
    });
  }

  // Service tier management
  getServiceTiers(): Observable<ServiceTier[]> {
    return this.http.get<ServiceTier[]>(`${this.baseUrl}/service_tiers/`);
  }

  createServiceTierDirect(serviceTier: Partial<ServiceTier>): Observable<ServiceTier> {
    return this.http.post<ServiceTier>(`${this.baseUrl}/service_tiers/`, serviceTier);
  }

  updateServiceTier(id: number, serviceTier: Partial<ServiceTier>): Observable<ServiceTier> {
    return this.http.put<ServiceTier>(`${this.baseUrl}/service_tiers/${id}/`, serviceTier);
  }

  deleteServiceTier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/service_tiers/${id}/`);
  }

  // Service price management
  getServicePrices(): Observable<ServicePrice[]> {
    return this.http.get<ServicePrice[]>(`${this.baseUrl}/service_prices/`);
  }

  createServicePriceDirect(servicePrice: Partial<ServicePrice>): Observable<ServicePrice> {
    return this.http.post<ServicePrice>(`${this.baseUrl}/service_prices/`, servicePrice);
  }

  updateServicePrice(id: number, servicePrice: Partial<ServicePrice>): Observable<ServicePrice> {
    return this.http.put<ServicePrice>(`${this.baseUrl}/service_prices/${id}/`, servicePrice);
  }

  deleteServicePrice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/service_prices/${id}/`);
  }

  // Billing record management
  getBillingRecords(filters?: any): Observable<BillingRecord[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<BillingRecord[]>(`${this.baseUrl}/billing_records/`, { params });
  }

  getBillingRecord(id: number): Observable<BillingRecord> {
    return this.http.get<BillingRecord>(`${this.baseUrl}/billing_records/${id}/`);
  }

  createBillingRecord(billingRecord: Partial<BillingRecord>): Observable<BillingRecord> {
    return this.http.post<BillingRecord>(`${this.baseUrl}/billing_records/`, billingRecord);
  }

  updateBillingRecord(id: number, billingRecord: Partial<BillingRecord>): Observable<BillingRecord> {
    return this.http.put<BillingRecord>(`${this.baseUrl}/billing_records/${id}/`, billingRecord);
  }

  deleteBillingRecord(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/billing_records/${id}/`);
  }

  getBillingSummary(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/billing_records/summary/`, { params });
  }

  calculateBilling(jobId: number, serviceTierId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/billing_records/calculate_billing/`, {
      job_id: jobId,
      service_tier_id: serviceTierId
    });
  }
}
