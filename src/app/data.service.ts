import { Injectable } from '@angular/core';
import {Protocol} from "./protocol";
import {ProtocolSession} from "./protocol-session";

@Injectable({
  providedIn: 'root'
})
export class DataService {
  protocol: Protocol|null = null;
  currentSession: ProtocolSession|null = null;
  constructor() { }
}
