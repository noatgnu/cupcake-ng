import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts: {header: string, body: string, delay: number, type: string, progress: number}[] = []
  constructor() { }

  async show(header: string, body: string, delay: number = 2000, type: string = "info", progress: number = 0) {
    const toast = {header, body, delay, type, progress}
    this.toasts.push(toast)
    return toast
  }

  remove(toast: any) {
    this.toasts = this.toasts.filter(t => t!=toast)
  }
}
