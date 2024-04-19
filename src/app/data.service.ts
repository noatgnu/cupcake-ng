import { Injectable } from '@angular/core';
import {Protocol} from "./protocol";
import {ProtocolSession} from "./protocol-session";
import {AccountsService} from "./accounts/accounts.service";
import {WebService} from "./web.service";
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DataService {
  _protocol: Protocol|null = null;
  protocolPermissions: {[key: string]: boolean} = {
    edit: false,
    view: false,
    delete: false,
  };
  set protocol(value: Protocol) {
    this._protocol = value;
    if (this.accounts.loggedIn) {
      this.web.checkProtocolPermissions(value.id).subscribe((response: any) => {
        if (response) {
          this.protocolPermissions = response;
        }
      })
    }
  }

  get protocol(): Protocol {
    return this._protocol!;
  }

  _currentSession: ProtocolSession|null = null;

  set currentSession(value: ProtocolSession|null) {
    this._currentSession = value;
    if (value) {
      if (this.accounts.loggedIn) {
        this.web.checkSessionPermissions(value.unique_id).subscribe((response: any) => {
          if (response) {
            this.currentSessionPermissions = response;
          }
        })
      }
    }

  }

  get currentSession(): ProtocolSession {
    return this._currentSession!;
  }

  currentSessionPermissions: {[key: string]: boolean} = {
    edit: false,
    view: false,
    delete: false,
  };

  redrawSubject: Subject<boolean> = new Subject<boolean>();

  stepCompletionSummary: {[key: string]: {started: boolean, completed: boolean, content: string, promptStarted: boolean}} = {};
  constructor(private accounts: AccountsService, private web: WebService) { }
}
