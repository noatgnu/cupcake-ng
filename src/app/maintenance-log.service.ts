import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {MaintenanceLog, MaintenanceLogQuery, MaintenanceLogCreate} from './maintenance-log';
import {environment} from "../environments/environment";
import {Annotation, AnnotationFolder} from "./annotation";

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

  getMaintenanceLogTemplate(id: number): Observable<MaintenanceLog> {
    return this.http.get<MaintenanceLog>(`${this.baseURL}/maintenance_logs/${id}/?is_template=true`);
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
      `${this.baseURL}/maintenance_logs/${templateId}/create_from_template/?is_template=true`,
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

  getAnnotations(maintenanceLogId: number): Observable<Annotation[]> {
    return this.http.get<Annotation[]>(`${this.baseURL}/maintenance_logs/${maintenanceLogId}/get_annotations/`);
  }

  addAnnotation(
    maintenanceLogId: number,
    annotationData: {
      annotation_type: string;
      annotation_name: string;
      annotation?: string;
      file?: File;
      [key: string]: any;
    }
  ): Observable<Annotation> {
    const formData = new FormData();
    Object.keys(annotationData).forEach(key => {
      if (key === 'file' && annotationData.file) {
        formData.append('file', annotationData.file);
      } else if (annotationData[key] !== undefined && annotationData[key] !== null) {
        formData.append(key, annotationData[key]);
      }
    });

    return this.http.post<Annotation>(
      `${this.baseURL}/maintenance_logs/${maintenanceLogId}/add_annotation/`,
      formData
    );
  }

  addFileAnnotation(
    maintenanceLogId: number,
    file: File,
    annotationType: string,
    annotationName?: string
  ): Observable<Annotation> {
    return this.addAnnotation(maintenanceLogId, {
      annotation_type: annotationType,
      annotation_name: annotationName || file.name,
      file: file
    });
  }

  addTextAnnotation(
    maintenanceLogId: number,
    text: string,
    annotationName: string
  ): Observable<Annotation> {
    const payload = {
      annotation: text,
      annotation_type: 'text',
      annotation_name: annotationName
    };

    return this.http.post<Annotation>(
      `${this.baseURL}/maintenance_logs/${maintenanceLogId}/add_annotation/`,
      payload
    );
  }

  addImageAnnotation(
    maintenanceLogId: number,
    imageFile: File,
    annotationName?: string
  ): Observable<Annotation> {
    return this.addFileAnnotation(
      maintenanceLogId,
      imageFile,
      'image',
      annotationName
    );
  }

  addVideoAnnotation(
    maintenanceLogId: number,
    videoFile: File,
    annotationName?: string
  ): Observable<Annotation> {
    return this.addFileAnnotation(
      maintenanceLogId,
      videoFile,
      'video',
      annotationName
    );
  }

  notifySlack(id: number, message?: string): Observable<any> {
    const payload = message ? { message } : {};
    return this.http.post(`${this.baseURL}/maintenance_logs/${id}/notify_slack/`, payload);
  }
}
