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
  darkMode: boolean = false;
  systemTheme: boolean = false;
  protocolPermissions: {[key: string]: boolean} = {
    edit: false,
    view: false,
    delete: false,
  };
  serverSettings: {
    use_llm: boolean,
    use_ocr: boolean,
    use_coturn: boolean,
    use_whisper: boolean,
  } = {
    use_llm: false,
    use_ocr: false,
    use_coturn: false,
    use_whisper: false
  }
  annotationPermissions: {[key: string]: {edit: boolean, view: boolean, delete: boolean}} = {};
  instrumentPermissions: {[key: string]: {can_view: boolean, can_book: boolean, can_manage: boolean}} = {};

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
  annotationCompletionSummary: {[key: string]: {started: boolean, completed: boolean, content: string, promptStarted: boolean}} = {};
  updateAnnotationSummary: Subject<{annotationID: number, summary: string}> = new Subject<{annotationID: number, summary: string}>();

  currentSessionPermissions: {[key: string]: boolean} = {
    edit: false,
    view: false,
    delete: false,
  };

  redrawSubject: Subject<boolean> = new Subject<boolean>();

  stepCompletionSummary: {[key: string]: {started: boolean, completed: boolean, content: string, promptStarted: boolean}} = {};

  massUnitMap: {[key: string]: {name: string, unit: string, baseConversion: number}} = {
    "ng": {name: "Nanogram", unit: "ng", baseConversion: 1},
    "ug": {name: "Microgram", unit: "ug", baseConversion: 1000},
    "mg": {name: "Milligram", unit: "mg", baseConversion: 1000000},
    "g": {name: "Gram", unit: "g", baseConversion: 1000000000},
    "kg": {name: "Kilogram", unit: "kg", baseConversion: 1000000000000}
  };
  baseMassUnit: string = "ng";
  massUnits: string[] = ["ng", "ug", "mg", "g", "kg"];

  volumeUnitMap: {[key: string]: {name: string, unit: string, baseConversion: number}} = {
    "nL": {name: "Nanoliter", unit: "nL", baseConversion: 1},
    "uL": {name: "Microliter", unit: "uL", baseConversion: 1000},
    "mL": {name: "Milliliter", unit: "mL", baseConversion: 1000000},
    "L": {name: "Liter", unit: "L", baseConversion: 1000000000}
  };
  baseVolumeUnit: string = "nL";
  volumeUnits: string[] = ["nL", "uL", "mL", "L"];

  molarityUnitMap: {[key: string]: {name: string, unit: string, baseConversion: number}} = {
    "nM": {name: "Nanomolar", unit: "nM", baseConversion: 1},
    "uM": {name: "Micromolar", unit: "uM", baseConversion: 1000},
    "mM": {name: "Millimolar", unit: "mM", baseConversion: 1000000},
    "M": {name: "Molar", unit: "M", baseConversion: 1000000000}
  };

  baseMolarityUnit: string = "nM";
  molarityUnits: string[] = ["nM", "uM", "mM", "M"];
  triggerReload: Subject<boolean> = new Subject<boolean>();


  constructor(private accounts: AccountsService, private web: WebService) { }

  setDarkMode(value: boolean) {
    this.darkMode = value;
    const body = document.getElementsByTagName('body')[0];
    if (value) {
      body.setAttribute('data-bs-theme', 'dark');
      body.classList.add('dark-theme');
    } else {
      body.setAttribute('data-bs-theme', 'light');
      body.classList.remove('dark-theme');
    }
  }

  convertMass(value: number, unit: string, targetUnit: string): number {
    return value * this.massUnitMap[unit].baseConversion / this.massUnitMap[targetUnit].baseConversion;
  }

  convertVolume(value: number, unit: string, targetUnit: string): number {
    return value * this.volumeUnitMap[unit].baseConversion / this.volumeUnitMap[targetUnit].baseConversion;
  }

  convertMolarity(value: number, unit: string, targetUnit: string): number {
    return value * this.molarityUnitMap[unit].baseConversion / this.molarityUnitMap[targetUnit].baseConversion;
  }
}
