import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, Subject } from "rxjs";
import { environment } from "../environments/environment";
import { Instrument, InstrumentQuery, InstrumentUsage, InstrumentUsageQuery, MaintenanceStatus } from "./instrument";
import { InstrumentJob, InstrumentJobQuery } from "./instrument-job";
import { NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";
import { Annotation } from "./annotation";

@Injectable({
  providedIn: 'root'
})
export class InstrumentService {
  baseURL: string = environment.baseURL;
  updateTrigger: Subject<boolean> = new Subject<boolean>()

  constructor(private http: HttpClient) { }

  instrumentDelayUsage(instrument_job_id: number, days: number, start_date: Date|undefined|null) {
    if (!start_date) {
      start_date = new Date()
    }
    return this.http.post<Instrument>(`${this.baseURL}/api/instrument/${instrument_job_id}/delay_usage/`, {days, start_date}, {responseType: 'json', observe: 'body'})
  }
  addInstrumentSupportInfo(instrument_id: number, payload: any) {
    return this.http.put<Instrument>(
      `${this.baseURL}/api/instrument/${instrument_id}/add_support_information/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  createInstrumentSupportInfo(instrument_id: number, payload: any) {
    return this.http.post<Instrument>(
      `${this.baseURL}/api/instrument/${instrument_id}/create_support_information/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  removeInstrumentSupportInfo(instrument_id: number, support_info_id: number) {
    return this.http.delete(
      `${this.baseURL}/api/instrument/${instrument_id}/remove_support_information/${support_info_id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  getInstrument(instrument_id: number) {
    return this.http.get<Instrument>(
      `${this.baseURL}/api/instrument/${instrument_id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  getInstruments(url?: string, limit: number = 5, offset: number = 0, searchTerm: string = "") {
    if (url) {
      return this.http.get<InstrumentQuery>(
        url,
        {responseType: 'json', observe: 'body'}

      )
    }
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
    if (searchTerm !== "") {
      params = params.append('search', searchTerm);
    }
    return this.http.get<InstrumentQuery>(
      `${this.baseURL}/api/instrument/`,
      {responseType: 'json', observe: 'body', params: params}
    )
  }

  createInstrument(instrument_name: string, instrument_description: string) {
    return this.http.post<Instrument>(
      `${this.baseURL}/api/instrument/`,
      {name: instrument_name, description: instrument_description},
      {responseType: 'json', observe: 'body'}
    )
  }

  updateInstrument(instrument_id: number, instrument_name: string, instrument_description: string, max_days_ahead: number|undefined|null, max_duration: number|undefined|null, image: string|undefined|null = undefined) {
    const payload: any = {name: instrument_name, description: instrument_description}
    if (max_days_ahead) {
      payload['max_days_ahead_pre_approval'] = max_days_ahead
    }
    if (max_duration) {
      payload['max_days_within_usage_pre_approval'] = max_duration
    }
    if (image) {
      payload['image'] = image
    }
    return this.http.put<Instrument>(
      `${this.baseURL}/api/instrument/${instrument_id}/`,
      payload,
      {responseType: 'json', observe: 'body'}
    )
  }

  deleteInstrument(instrument_id: number) {
    return this.http.delete(
      `${this.baseURL}/api/instrument/${instrument_id}/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  getInstrumentPermission(instrument_id: number) {
    return this.http.get<{can_view: boolean, can_manage: boolean, can_book: boolean}>(
      `${this.baseURL}/api/instrument/${instrument_id}/get_instrument_permission/`,
      {responseType: 'json', observe: 'body'}
    )
  }

  getUserInstrumentPermission(instrument_id: number, username: string) {
    return this.http.get<{can_view: boolean, can_manage: boolean, can_book: boolean}>(
      `${this.baseURL}/api/instrument/${instrument_id}/get_instrument_permission_for/?user=${username}`,
      {responseType: 'json', observe: 'body'}
    )
  }

  assignInstrumentPermission(instrument_id: number, username: string, permissions: any) {
    return this.http.post(
      `${this.baseURL}/api/instrument/${instrument_id}/assign_instrument_permission/`,
      {user: username, can_view: permissions.can_view, can_manage: permissions.can_manage, can_book: permissions.can_book},
      {responseType: 'json', observe: 'body'}
    )
  }

  getMaintenanceStatus(instrumentId: number): Observable<MaintenanceStatus> {
    return this.http.get<MaintenanceStatus>(`${this.baseURL}/api/instrument/${instrumentId}/get_maintenance_status/`);
  }
}
