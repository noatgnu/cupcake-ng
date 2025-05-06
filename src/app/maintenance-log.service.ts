import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {MaintenanceLog, MaintenanceLogQuery, MaintenanceLogCreate} from './maintenance-log';
import {environment} from "../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class MaintenanceLogService {
  baseURL: string = environment.baseURL + '/api';

  constructor(private http: HttpClient) {}

  getMaintenanceLogs(params?: any): Observable<any> {
    return this.http.get<MaintenanceLogQuery>(`${this.baseURL}/maintenance_logs/`, { params });
  }

  getMaintenanceLog(id: number): Observable<MaintenanceLog> {
    return this.http.get<MaintenanceLog>(`${this.baseURL}/maintenance_logs/${id}/`);
  }

  createMaintenanceLog(data: any): Observable<MaintenanceLog> {
    return this.http.post<MaintenanceLog>(`${this.baseURL}/maintenance_logs/`, data);
  }

  updateMaintenanceLog(id: number, data: any): Observable<MaintenanceLog> {
    return this.http.put<MaintenanceLog>(`${this.baseURL}/maintenance_logs/${id}/`, data);
  }

  deleteMaintenanceLog(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/maintenance_logs/${id}/`);
  }

  getMaintenanceTypes(): Observable<Array<{value: string, label: string}>> {
    return this.http.get<Array<{value: string, label: string}>>(`${this.baseURL}/maintenance_logs/get_maintenance_types/`);
  }

  getStatusTypes(): Observable<Array<{value: string, label: string}>> {
    return this.http.get<Array<{value: string, label: string}>>(`${this.baseURL}/maintenance_logs/get_status_types/`);
  }

  updateStatus(id: number, status: string): Observable<MaintenanceLog> {
    return this.http.post<MaintenanceLog>(`${this.baseURL}/maintenance_logs/${id}/update_status/`, { status });
  }

  getTemplates(params?: any): Observable<MaintenanceLogQuery> {
    const templateParams = { ...params, is_template: 'true' };
    return this.http.get<MaintenanceLogQuery>(`${this.baseURL}/maintenance_logs/`, { params: templateParams });
  }

  createFromTemplate(templateId: number): Observable<MaintenanceLog> {
    return this.http.post<MaintenanceLog>(
      `${this.baseURL}/maintenance_logs/${templateId}/create_from_template/`,
      {}
    );
  }

  createTemplate(data: MaintenanceLogCreate & { is_template: true }): Observable<MaintenanceLog> {
    return this.http.post<MaintenanceLog>(`${this.baseURL}/maintenance_logs/`, data);
  }

  toggleTemplate(id: number, isTemplate: boolean): Observable<MaintenanceLog> {
    return this.http.patch<MaintenanceLog>(
      `${this.baseURL}/maintenance_logs/${id}/`,
      { is_template: isTemplate }
    );
  }
}
