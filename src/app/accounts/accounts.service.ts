import { Injectable } from '@angular/core';
import {Observable, Subject} from "rxjs";
import {environment} from "../../environments/environment";
import {HttpClient, HttpHeaders} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class AccountsService {
  token: string = ""
  loggedIn: boolean = false
  baseURL: string = environment.baseURL;
  username: string = ""
  lastVisited: Date = new Date()
  triggerLoginSubject: Subject<boolean> = new Subject<boolean>()

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<any> {
    this.loggedIn = false
    const headers = new HttpHeaders()
    headers.append('Content-Type', 'application/json')
    headers.append('Accept', 'application/json')
    return this.http.post(
      `${this.baseURL}/api/token-auth/`,
      {"username": username, "password": password},
      {responseType: 'json', observe: 'body'}
    );
  }

  logout() {
    this.loggedIn = false
    this.token = ""
    localStorage.removeItem("cupcakeToken")
    localStorage.removeItem("cupcakeUsername")
  }

  loadLastVisited() {
    const current = new Date()
    const lastVisited = localStorage.getItem("cupcakeLastVisited")
    if (lastVisited) {
      this.lastVisited = new Date(JSON.parse(lastVisited))
      this.saveDate(current)
    } else{
      this.lastVisited = current
      this.saveDate(current)
    }
  }

  saveDate(date: Date) {
    localStorage.setItem("cupcakeLastVisited", JSON.stringify(date))
  }
}
