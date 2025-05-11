import { Component, Input, Output, EventEmitter } from '@angular/core';
import {NgClass} from "@angular/common";

@Component({
  selector: 'app-chat-message',
  imports: [
    NgClass
  ],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss'
})
export class ChatMessageComponent {
  private _message: any;
  @Input() set message(value: any) {
    this._message = value;
    if (value && value.timestamp) {
      this.formattedTimestamp = this.formatTimestamp(value.timestamp);
    }
  }
  get message(): any {
    return this._message;
  }

  formattedTimestamp: string = 'Unknown time';

  @Input() currentUserId: string | null | undefined = null;
  @Output() fileRequest = new EventEmitter<any>();

  formatTimestamp(timestamp: number | string | undefined | null): string {
    if (timestamp === undefined || timestamp === null) {
      return 'Unknown time';
    }

    const numTimestamp = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;

    if (isNaN(numTimestamp)) {
      console.warn('Invalid timestamp:', timestamp);
      return 'Unknown time';
    }

    return new Date(numTimestamp).toLocaleTimeString();
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }

  onRequestFile(fileMetadata: any): void {
    this.fileRequest.emit(fileMetadata);
  }

}
