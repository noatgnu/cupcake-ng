import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../environments/environment";
import {Observable} from "rxjs";
import {Protocol} from "./protocol";
import {ProtocolSession} from "./protocol-session";
import {TimeKeeper} from "./time-keeper";

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
}
