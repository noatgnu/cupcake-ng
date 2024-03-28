import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {environment} from "../environments/environment";
import {map, Observable} from "rxjs";
import {Protocol, ProtocolSection, ProtocolStep} from "./protocol";
import {ProtocolSession} from "./protocol-session";
import {TimeKeeper} from "./time-keeper";
import {AnnotationQuery} from "./annotation";

@Injectable({
  providedIn: 'root'
})
export class WebService {
  baseURL: string = environment.baseURL;

  constructor(private http: HttpClient) { }

  postProtocol(url: string): Observable<Protocol> {
    return this.http.post<Protocol>(
      `${this.baseURL}/api/protocol/`,
      {"url": url},
      {responseType: 'json', observe: 'body'}
    );
  }

  getProtocol(id: number|string): Observable<Protocol> {
    return this.http.get<Protocol>(
      `${this.baseURL}/api/protocol/${id}/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  getAssociatedSessions(protocol_id: number|string): Observable<ProtocolSession[]> {
    return this.http.get<ProtocolSession[]>(
      `${this.baseURL}/api/protocol/${protocol_id}/get_associated_sessions/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  createSession(protocol_ids: number[]|string[] = []): Observable<ProtocolSession> {
    if (protocol_ids.length === 0) {
      return this.http.post<ProtocolSession>(
        `${this.baseURL}/api/session/`,
        {},
        {responseType: 'json', observe: 'body'}
      );
    }
    return this.http.post<ProtocolSession>(
      `${this.baseURL}/api/session/`,
      {protocol_ids: protocol_ids},
      {responseType: 'json', observe: 'body'}
    );
  }

  getProtocolSession(id: number|string): Observable<ProtocolSession> {
    return this.http.get<ProtocolSession>(
      `${this.baseURL}/api/session/${id}/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  postStepTimeKeeper(session_id: number|string, step_id: number|string, started: boolean = false, start_date: Date|null = null, current_duration: number = 0): Observable<TimeKeeper> {
    const body: any = {session: session_id, step: step_id, started: started};
    if (start_date !== null) {
      body["start_time"] = start_date;
    }
    if (current_duration !== 0) {
      body["current_duration"] = current_duration;
    }
    console.log(body)
    return this.http.post<TimeKeeper>(
`${this.baseURL}/api/timekeeper/`,
      body,
      {responseType: 'json', observe: 'body'}
    );
  }

  updateTimeKeeper(id: number|string, started: boolean = false, start_date: Date|null = null, current_duration: number|null = null): Observable<TimeKeeper> {
    const body: any = {started: started};
    if (start_date !== null) {
      body["start_time"] = start_date;
    }
    if (current_duration !== null) {
      body["current_duration"] = current_duration;
    }
    return this.http.put<TimeKeeper>(
      `${this.baseURL}/api/timekeeper/${id}/`,
      body,
      {responseType: 'json', observe: 'body'}
    );
  }

  saveAnnotationText(session_id: string, step_id: number, text: string) {
    const form = new FormData();
    form.append('annotation', text);
    form.append('annotation_type', 'text');
    form.append('step', step_id.toString());
    form.append('session', session_id);
    return this.http.post(
      `${this.baseURL}/api/annotation/`,
      form,
      {responseType: 'json', observe: 'body'}
    );
  }

  getAnnotations(session_id: string, step_id: number): Observable<AnnotationQuery> {
    let params = new HttpParams()
    params = params.set('session', session_id);
    params = params.set('step', step_id.toString());
    return this.http.get<AnnotationQuery>(
      `${this.baseURL}/api/annotation/`,
      {responseType: 'json', observe: 'body', params: params}
    );
  }

  getAnnotationsURL(url: string): Observable<AnnotationQuery> {
    return this.http.get<AnnotationQuery>(
      url,
      {responseType: 'json', observe: 'body'}
    );
  }

  saveAnnotationFile(session_id: string, step_id: number, file: File, annotation_type: string = 'file') {
    const form = new FormData()
    form.append('annotation', "");
    form.append('annotation_type', annotation_type);
    form.append('step', step_id.toString());
    form.append('session', session_id);
    form.append('file', file);
    console.log(session_id, step_id, file)
    return this.http.post(
      `${this.baseURL}/api/annotation/`,
      form,
      {responseType: 'json', observe: 'body'}
    );
  }

  saveSketch(session_id: string, step_id: number, strokes: any[]) {
    const form = new FormData()
    form.append('annotation', "");
    form.append('annotation_type', 'sketch');
    form.append('step', step_id.toString());
    form.append('session', session_id);
    const file = new File([JSON.stringify(strokes)], 'sketch.json', {type: 'application/json'});
    form.append('file', file);
    return this.http.post(
      `${this.baseURL}/api/annotation/`,
      form,
      {responseType: 'json', observe: 'body'}
    );
  }

  getDownloadURL(url: string) {
    return this.http.get(
      url,
      {responseType: 'json', observe: 'body'}
    );
  }

  getAnnotationFile(id: number|string) {
    return this.http.get<string>(
      `${this.baseURL}/api/annotation/${id}/download_file/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  deleteAnnotation(id: number|string) {
    return this.http.delete(
      `${this.baseURL}/api/annotation/${id}/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  getAnnotationImageBlobUrl(id: number|string) {
    return this.http.get(
      `${this.baseURL}/api/annotation/${id}/download_file/`,
      {responseType: 'blob', observe: 'body'}
    ).pipe(map((blob: Blob) => URL.createObjectURL(blob)));
  }

  saveMediaRecorderBlob(session_id: string, step_id: number, blob: Blob, annotation_type: string) {
    const form = new FormData()
    form.append('annotation', "");
    form.append('annotation_type', annotation_type);
    form.append('step', step_id.toString());
    form.append('session', session_id);
    let file: File
    if (annotation_type === 'audio') {
      file = new File([blob], `recording${annotation_type}.webm`, {type: 'audio/webm'});
    } else {
      file = new File([blob], `recording${annotation_type}.webm`, {type: 'video/webm'});
    }

    form.append('file', file);
    return this.http.post(
      `${this.baseURL}/api/annotation/`,
      form,
      {responseType: 'json', observe: 'body'}
    );

  }

  createProtocol(protocol_title: string, protocol_description: string) {
    return this.http.post<Protocol>(
      `${this.baseURL}/api/protocol/`,
      {protocol_title: protocol_title, protocol_description: protocol_description},
      {responseType: 'json', observe: 'body'}
    );
  }

  createProtocolStep(protocol_id: number, step_description: string, step_duration: number, step_section: number) {
    return this.http.post<ProtocolStep>(
      `${this.baseURL}/api/step/`,
      {step_description: step_description, step_duration: step_duration, step_section: step_section, protocol: protocol_id},
      {responseType: 'json', observe: 'body'}
    );
  }

  updateProtocolStep(step_id: number, step_description: string, step_duration: number) {
    return this.http.patch<ProtocolStep>(
      `${this.baseURL}/api/step/${step_id}/`,
      {
        step_description: step_description,
        step_duration: step_duration
      },
      {responseType: 'json', observe: 'body'}
    );
  }

  deleteProtocolStep(step_id: number) {
    return this.http.delete(
      `${this.baseURL}/api/step/${step_id}/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  moveProtocolStep(step_id: number, up: boolean = true) {
    let url = `${this.baseURL}/api/step/${step_id}/move_up/`
    if (!up) {
      url = `${this.baseURL}/api/step/${step_id}/move_down/`
    }
    return this.http.patch<ProtocolStep>(url, {}, {responseType: 'json', observe: 'body'})
  }

  createProtocolSection(protocol_id: number, section_description: string, section_duration: number) {
    return this.http.post<ProtocolSection>(
      `${this.baseURL}/api/section/`,
      {section_description: section_description, section_duration: section_duration, protocol: protocol_id},
      {responseType: 'json', observe: 'body'}
    );
  }

  updateProtocolSection(section_id: number, section_description: string, section_duration: number) {
    return this.http.put<ProtocolSection>(
      `${this.baseURL}/api/section/${section_id}/`,
      {
        section_description: section_description,
        section_duration: section_duration
      },
      {responseType: 'json', observe: 'body'}
    );
  }

  deleteSection(section_id: number) {
    return this.http.delete(
      `${this.baseURL}/api/section/${section_id}/`,
      {responseType: 'json', observe: 'body'}
    );
  }


}
