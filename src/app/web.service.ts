import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../environments/environment";
import {Observable} from "rxjs";
import {Protocol} from "./protocol";

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

  getAssociatedSessions(protocol_id: number|string): Observable<any> {
    return this.http.get<any>(
      `${this.baseURL}/api/protocol/${protocol_id}/get_associated_sessions/`,
      {responseType: 'json', observe: 'body'}
    );
  }

  createSession(protocol_id: number|string): Observable<any> {
    return this.http.post<any>(
      `${this.baseURL}/api/protocol/${protocol_id}/create_session/`,
      {},
      {responseType: 'json', observe: 'body'}
    );
  }
}
