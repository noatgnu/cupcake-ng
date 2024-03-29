import { Injectable } from '@angular/core';
import {environment} from "../environments/environment";
import {WebSocketSubject} from "rxjs/internal/observable/dom/WebSocketSubject";
import {AccountsService} from "./accounts.service";

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  baseURL = environment.baseURL.replace("http", "ws")
  timerWSConnection?: WebSocketSubject<any>

  constructor(private accounts: AccountsService) { }

  connectTimerWS(sessionID: string) {
    console.log("Connecting to timer websocket")
    console.log(`${this.baseURL}/ws/timer/${sessionID}/?token=${this.accounts.token}`)
    this.timerWSConnection = new WebSocketSubject({
      url: `${this.baseURL}/ws/timer/${sessionID}/?token=${this.accounts.token}`,
      openObserver: {
        next: () => {
          console.log("Connected to timer websocket")
        }
      },
      closeObserver: {
        next: () => {
          console.log("Closed connection to timer websocket")
        }
      }
    })
  }


  closeTimerWS() {
    if (this.timerWSConnection) {
      this.timerWSConnection.unsubscribe()
    }
  }
}
