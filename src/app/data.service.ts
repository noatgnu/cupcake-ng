import { Injectable } from '@angular/core';
import {Protocol} from "./protocol";
import {ProtocolSession} from "./protocol-session";

@Injectable({
  providedIn: 'root'
})
export class DataService {
  protocol: Protocol|null = null;
  currentSession: ProtocolSession|null = null;
  stepCompletionSummary: {[key: string]: {started: boolean, completed: boolean, content: string}} = {};
  constructor() { }
}
