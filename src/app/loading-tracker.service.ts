import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LoadingTrackerService {
  private loadingSubject = new BehaviorSubject<string | null>(null);
  loading$ = this.loadingSubject.asObservable();

  setLoadingChunk(chunk: string) {
    this.loadingSubject.next(chunk);
  }

  clearLoadingChunk() {
    this.loadingSubject.next(null);
  }
  constructor() { }
}
