import { Injectable } from '@angular/core';
import {Protocol} from "./protocol";

@Injectable({
  providedIn: 'root'
})
export class DataService {
  protocol: Protocol|null = null;
  constructor() { }
}
