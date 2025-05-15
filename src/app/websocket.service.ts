import {Injectable, OnDestroy} from '@angular/core';
import {environment} from "../environments/environment";
import {WebSocketSubject} from "rxjs/internal/observable/dom/WebSocketSubject";
import {AccountsService} from "./accounts/accounts.service";
import {Subject, Subscription, takeUntil} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  baseURL = environment.baseURL.replace("http", "ws")
  timerWSConnection?: WebSocketSubject<any>
  annotationWSConnection?: WebSocketSubject<any>
  userWSConnection?: WebSocketSubject<any>
  summaryWSConnection?: WebSocketSubject<any>
  instrumentJobWSConnection?: WebSocketSubject<any>
  userSubject: Subject<boolean> = new Subject<boolean>()
  timerConnected: boolean = false
  annotationConnected: boolean = false
  userConnected: boolean = false
  summaryConnected: boolean = false
  instrumentJobConnected: boolean = false

  private timerIntentionalDisconnect = false;
  private annotationIntentionalDisconnect = false;
  private userIntentionalDisconnect = false;
  private summaryIntentionalDisconnect = false;
  private instrumentJobIntentionalDisconnect = false;

  private maxRetries = 5;
  private destroy$ = new Subject<void>();
  private subscriptions: Subscription[] = [];

  constructor(private accounts: AccountsService) { }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  connectInstrumentJobWS(sessionID: string) {
    this.instrumentJobIntentionalDisconnect = false;

    console.log("Connecting to instrument job websocket")
    console.log(`${this.baseURL}/ws/instrument-job/${sessionID}/?token=${this.accounts.token}`)
    this.instrumentJobWSConnection = new WebSocketSubject({
      url: `${this.baseURL}/ws/instrument_job/${sessionID}/?token=${this.accounts.token}`,
      openObserver: {
        next: () => {
          console.log("Connected to instrument job websocket")
          this.instrumentJobConnected = true;
        }
      },
      closeObserver: {
        next: () => {
          console.log("Closed connection to instrument job websocket")
          this.instrumentJobConnected = false;
          if (!this.instrumentJobIntentionalDisconnect) {
            this.reconnectInstrumentJobWS(sessionID);
          }
        }
      }
    })

    const sub = this.instrumentJobWSConnection
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          console.error('Instrument Job WS error:', err);
          if (!this.instrumentJobIntentionalDisconnect) {
            this.reconnectInstrumentJobWS(sessionID);
          }
        }
      });

    this.subscriptions.push(sub);
  }

  reconnectInstrumentJobWS(sessionID: string, retryCount = 0) {
    if (this.instrumentJobIntentionalDisconnect || retryCount >= this.maxRetries) return;

    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);

    console.log(`Attempting to reconnect Instrument Job WS in ${delay}ms (attempt ${retryCount + 1})`);

    setTimeout(() => {
      if (!this.instrumentJobIntentionalDisconnect) {
        this.connectInstrumentJobWS(sessionID);
      }
    }, delay);
  }

  closeInstrumentJobWS() {
    this.instrumentJobIntentionalDisconnect = true;
    if (this.instrumentJobWSConnection) {
      this.instrumentJobWSConnection.complete();
      this.instrumentJobWSConnection = undefined;
    }
  }

  connectTimerWS(sessionID: string) {
    this.timerIntentionalDisconnect = false;

    console.log("Connecting to timer websocket");
    const url = `${this.baseURL}/ws/timer/${sessionID}/?token=${this.accounts.token}`;

    this.timerWSConnection = new WebSocketSubject({
      url,
      openObserver: {
        next: () => {
          console.log("Connected to timer websocket");
          this.timerConnected = true;
        }
      },
      closeObserver: {
        next: () => {
          console.log("Closed connection to timer websocket");
          this.timerConnected = false;
          if (!this.timerIntentionalDisconnect) {
            this.reconnectTimerWS(sessionID);
          }
        }
      }
    });

    const sub = this.timerWSConnection
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          console.error('Timer WS error:', err);
          if (!this.timerIntentionalDisconnect) {
            this.reconnectTimerWS(sessionID);
          }
        }
      });

    this.subscriptions.push(sub);
  }

  reconnectTimerWS(sessionID: string, retryCount = 0) {
    if (this.timerIntentionalDisconnect || retryCount >= this.maxRetries) return;

    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
    console.log(`Attempting to reconnect Timer WS in ${delay}ms (attempt ${retryCount + 1})`);

    setTimeout(() => {
      if (!this.timerIntentionalDisconnect) {
        this.connectTimerWS(sessionID);
      }
    }, delay);
  }

  closeTimerWS() {
    this.timerIntentionalDisconnect = true;
    if (this.timerWSConnection) {
      this.timerWSConnection.complete();
      this.timerWSConnection = undefined;
    }
  }

  connectAnnotationWS(sessionID: string) {
    this.annotationIntentionalDisconnect = false;

    console.log("Connecting to annotation websocket")
    console.log(`${this.baseURL}/ws/annotation/${sessionID}/?token=${this.accounts.token}`)
    this.annotationWSConnection = new WebSocketSubject({
      url: `${this.baseURL}/ws/annotation/${sessionID}/?token=${this.accounts.token}`,
      openObserver: {
        next: () => {
          console.log("Connected to annotation websocket")
          this.annotationConnected = true;
        }
      },
      closeObserver: {
        next: () => {
          console.log("Closed connection to annotation websocket")
          this.annotationConnected = false;
          if (!this.annotationIntentionalDisconnect) {
            this.reconnectAnnotationWS(sessionID);
          }
        }
      }
    })

    const sub = this.annotationWSConnection
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          console.error('Annotation WS error:', err);
          if (!this.annotationIntentionalDisconnect) {
            this.reconnectAnnotationWS(sessionID);
          }
        }
      });
    this.subscriptions.push(sub);
  }

  reconnectAnnotationWS(sessionID: string, retryCount = 0) {
    if (this.annotationIntentionalDisconnect || retryCount >= this.maxRetries) return;

    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
    console.log(`Attempting to reconnect Annotation WS in ${delay}ms (attempt ${retryCount + 1})`);

    setTimeout(() => {
      if (!this.annotationIntentionalDisconnect) {
        this.connectAnnotationWS(sessionID);
      }
    }, delay);
  }


  closeAnnotationWS() {
    this.annotationIntentionalDisconnect = true;
    if (this.annotationWSConnection) {
      this.annotationWSConnection.complete();
      this.annotationWSConnection = undefined;
    }
  }

  connectUserWS() {
    this.userIntentionalDisconnect = false;
    console.log("Connecting to user websocket")
    console.log(`${this.baseURL}/ws/user/?token=${this.accounts.token}`)
    this.userWSConnection = new WebSocketSubject({
      url: `${this.baseURL}/ws/user/?token=${this.accounts.token}`,
      openObserver: {
        next: () => {
          console.log("Connected to user websocket")
          this.userConnected = true;
        }
      },
      closeObserver: {
        next: () => {
          console.log("Closed connection to user websocket")
          this.userConnected = false;
          if (!this.userIntentionalDisconnect) {
            this.reconnectUserWS();
          }
        }
      },
    })

    const sub = this.userWSConnection
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          console.error('User WS error:', err);
          if (!this.userIntentionalDisconnect) {
            this.reconnectUserWS();
          }
        }
      });
    this.subscriptions.push(sub);
  }

  reconnectUserWS(retryCount = 0) {
    if (this.userIntentionalDisconnect || retryCount >= this.maxRetries) return;

    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
    console.log(`Attempting to reconnect User WS in ${delay}ms (attempt ${retryCount + 1})`);

    setTimeout(() => {
      if (!this.userIntentionalDisconnect) {
        this.connectUserWS();
      }
    }, delay);
  }

  closeUserWS() {
    this.userIntentionalDisconnect = true;
    if (this.userWSConnection) {
      this.userWSConnection.complete();
      this.userWSConnection = undefined;
    }
  }


  connectSummaryWS() {
    this.summaryIntentionalDisconnect = false;

    console.log("Connecting to summary websocket")
    console.log(`${this.baseURL}/ws/summary/?token=${this.accounts.token}`)
    this.summaryWSConnection = new WebSocketSubject({
      url: `${this.baseURL}/ws/summary/?token=${this.accounts.token}`,
      openObserver: {
        next: () => {
          console.log("Connected to summary websocket")
          this.summaryConnected = true;
        }
      },
      closeObserver: {
        next: () => {
          console.log("Closed connection to summary websocket")
          this.summaryConnected = false;
          if (!this.summaryIntentionalDisconnect) {
            this.reconnectSummaryWS();
          }
        }
      },
    })

    const sub = this.summaryWSConnection
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          console.error('Summary WS error:', err);
          if (!this.summaryIntentionalDisconnect) {
            this.reconnectSummaryWS();
          }
        }
      });
    this.subscriptions.push(sub);
  }

  reconnectSummaryWS(retryCount = 0) {
    if (this.summaryIntentionalDisconnect || retryCount >= this.maxRetries) return;

    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
    console.log(`Attempting to reconnect Summary WS in ${delay}ms (attempt ${retryCount + 1})`);

    setTimeout(() => {
      if (!this.summaryIntentionalDisconnect) {
        this.connectSummaryWS();
      }
    }, delay);
  }

  closeSummaryWS() {

    this.summaryIntentionalDisconnect = true;
    if (this.summaryWSConnection) {
      this.summaryWSConnection.complete();
      this.summaryWSConnection = undefined;
    }
  }
}
