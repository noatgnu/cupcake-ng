import { Injectable } from '@angular/core';
import {environment} from "../environments/environment";
import {WebSocketSubject} from "rxjs/internal/observable/dom/WebSocketSubject";
import {AccountsService} from "./accounts/accounts.service";
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  baseURL = environment.baseURL.replace("http", "ws")
  timerWSConnection?: WebSocketSubject<any>
  annotationWSConnection?: WebSocketSubject<any>
  userWSConnection?: WebSocketSubject<any>
  summaryWSConnection?: WebSocketSubject<any>
  instrumentJobWSConnection?: WebSocketSubject<any>
  userSubject: Subject<boolean> = new Subject<boolean>()

  constructor(private accounts: AccountsService) { }
  connectInstrumentJobWS(sessionID: string) {
    console.log("Connecting to instrument job websocket")
    console.log(`${this.baseURL}/ws/instrument-job/${sessionID}/?token=${this.accounts.token}`)
    this.instrumentJobWSConnection = new WebSocketSubject({
      url: `${this.baseURL}/ws/instrument_job/${sessionID}/?token=${this.accounts.token}`,
      openObserver: {
        next: () => {
          console.log("Connected to instrument job websocket")
        }
      },
      closeObserver: {
        next: () => {
          console.log("Closed connection to instrument job websocket")
        }
      }
    })
  }

  closeInstrumentJobWS() {
    if (this.instrumentJobWSConnection) {
      this.instrumentJobWSConnection.unsubscribe()
    }
  }

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

  connectAnnotationWS(sessionID: string) {
    console.log("Connecting to annotation websocket")
    console.log(`${this.baseURL}/ws/annotation/${sessionID}/?token=${this.accounts.token}`)
    this.annotationWSConnection = new WebSocketSubject({
      url: `${this.baseURL}/ws/annotation/${sessionID}/?token=${this.accounts.token}`,
      openObserver: {
        next: () => {
          console.log("Connected to annotation websocket")
        }
      },
      closeObserver: {
        next: () => {
          console.log("Closed connection to annotation websocket")
        }
      }
    })
  }

  closeAnnotationWS() {
    if (this.annotationWSConnection) {
      this.annotationWSConnection.unsubscribe()
    }
  }

  connectUserWS() {
    console.log("Connecting to user websocket")
    console.log(`${this.baseURL}/ws/user/?token=${this.accounts.token}`)
    this.userWSConnection = new WebSocketSubject({
      url: `${this.baseURL}/ws/user/?token=${this.accounts.token}`,
      openObserver: {
        next: () => {
          console.log("Connected to user websocket")
        }
      },
      closeObserver: {
        next: () => {
          console.log("Closed connection to user websocket")
        }
      },
    })
  }

  closeUserWS() {
    if (this.userWSConnection) {
      this.userWSConnection.unsubscribe()
    }
  }

  connectSummaryWS() {
    console.log("Connecting to summary websocket")
    console.log(`${this.baseURL}/ws/summary/?token=${this.accounts.token}`)
    this.summaryWSConnection = new WebSocketSubject({
      url: `${this.baseURL}/ws/summary/?token=${this.accounts.token}`,
      openObserver: {
        next: () => {
          console.log("Connected to summary websocket")
        }
      },
      closeObserver: {
        next: () => {
          console.log("Closed connection to summary websocket")
        }
      },
    })
  }

  closeSummaryWS() {
    if (this.summaryWSConnection) {
      this.summaryWSConnection.unsubscribe()
    }
  }
}
