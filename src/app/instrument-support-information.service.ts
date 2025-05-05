import { Injectable } from '@angular/core';
import {environment} from "../environments/environment";
import {SupportInformation, ExternalContactDetails, ExternalContact, InstrumentSupportInfo, Instrument} from "./instrument";
import { HttpClient } from '@angular/common/http';
import { Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class InstrumentSupportInformationService {
  baseURL: string = environment.baseURL + '/api';
  constructor(private http: HttpClient) { }

  getAllSupportInformation(): Observable<SupportInformation[]> {
    return this.http.get<SupportInformation[]>(`${this.baseURL}/support_information/`);
  }

  getSupportInformation(id: number): Observable<SupportInformation> {
    return this.http.get<SupportInformation>(`${this.baseURL}/support_information/${id}/`);
  }

  createSupportInformation(data: SupportInformation): Observable<SupportInformation> {
    return this.http.post<SupportInformation>(`${this.baseURL}/support_information/`, data);
  }

  updateSupportInformation(id: number, data: Partial<SupportInformation>): Observable<SupportInformation> {
    data.location_id = data.location?.id
    return this.http.patch<SupportInformation>(`${this.baseURL}/support_information/${id}/`, data);
  }

  deleteSupportInformation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/support_information/${id}/`);
  }

  // External Contact operations
  getExternalContact(id: number): Observable<ExternalContact> {
    return this.http.get<ExternalContact>(`${this.baseURL}/external-contacts/${id}/`);
  }

  createExternalContact(data: ExternalContact): Observable<ExternalContact> {
    return this.http.post<ExternalContact>(`${this.baseURL}/external-contacts/`, data);
  }

  updateExternalContact(id: number, data: Partial<ExternalContact>): Observable<ExternalContact> {
    return this.http.patch<ExternalContact>(`${this.baseURL}/external-contacts/${id}/`, data);
  }

  deleteExternalContact(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/external-contacts/${id}/`);
  }

  getContactDetail(id: number): Observable<ExternalContactDetails> {
    return this.http.get<ExternalContactDetails>(`${this.baseURL}/contact-details/${id}/`);
  }

  createContactDetail(data: ExternalContactDetails): Observable<ExternalContactDetails> {
    return this.http.post<ExternalContactDetails>(`${this.baseURL}/contact-details/`, data);
  }

  updateContactDetail(id: number, data: Partial<ExternalContactDetails>): Observable<ExternalContactDetails> {
    return this.http.patch<ExternalContactDetails>(`${this.baseURL}/contact-details/${id}/`, data);
  }

  deleteContactDetail(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/contact-details/${id}/`);
  }

  addVendorContact(supportInfoId: number, contact: ExternalContact): Observable<ExternalContact> {
    return this.http.post<ExternalContact>(
      `${this.baseURL}/support_information/${supportInfoId}/add_vendor_contact/`,
      contact
    );
  }

  addManufacturerContact(supportInfoId: number, contact: ExternalContact): Observable<ExternalContact> {
    return this.http.post<ExternalContact>(
      `${this.baseURL}/support_information/${supportInfoId}/add_manufacturer_contact/`,
      contact
    );
  }

  removeContact(supportInfoId: number, contactId: number, contactType: 'vendor' | 'manufacturer'): Observable<void> {
    return this.http.delete<void>(
      `${this.baseURL}/support_information/${supportInfoId}/remove_contact/`,
      { body: { contact_id: contactId, contact_type: contactType } }
    );
  }

  addContactDetail(contactId: number, detail: ExternalContactDetails): Observable<ExternalContactDetails> {
    return this.http.post<ExternalContactDetails>(
      `${this.baseURL}/external-contacts/${contactId}/add_contact_detail/`,
      detail
    );
  }

  removeContactDetail(contactId: number, detailId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseURL}/external-contacts/${contactId}/remove_contact_detail/`,
      { body: { detail_id: detailId } }
    );
  }

  getInstrumentSupportInformation(instrumentId: number): Observable<SupportInformation[]> {
    return this.http.get<SupportInformation[]>(
      `${this.baseURL}/instrument/${instrumentId}/list_support_information/`
    );
  }

  addSupportInformationToInstrument(instrumentId: number, supportInfoId: number): Observable<any> {
    return this.http.post(
      `${this.baseURL}/instrument/${instrumentId}/add_support_information/`,
      { support_information_id: supportInfoId }
    );
  }

  removeSupportInformationFromInstrument(instrumentId: number, supportInfoId: number): Observable<any> {
    return this.http.post(
      `${this.baseURL}/instrument/${instrumentId}/remove_support_information/`,
      { support_information_id: supportInfoId }
    );
  }

  createAndAddSupportInformation(instrumentId: number, supportInfo: SupportInformation): Observable<SupportInformation> {
    return this.http.post<SupportInformation>(
      `${this.baseURL}/instrument/${instrumentId}/create_support_information/`,
      supportInfo
    );
  }
}
