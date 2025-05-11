import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, OnChanges, OnDestroy} from '@angular/core';
import {ChatMessageComponent} from "./chat-message/chat-message.component";
import {FormsModule} from "@angular/forms";
import {ChatMessage, WebrtcService} from "../webrtc.service";
import {Subscription} from "rxjs";
import {NgClass} from "@angular/common";


@Component({
  selector: 'app-chat',
  imports: [
    ChatMessageComponent,
    FormsModule,
    NgClass
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnChanges, OnInit, OnDestroy {
  private _messages: ChatMessage[] = [];
  @Input() set messages(value: ChatMessage[]) {
    this._messages = value;
    console.log(this.messages);
  }
  get messages(): ChatMessage[] {
    return this._messages;
  }
  @Input() currentUserId: string|null|undefined = null;
  @Input() showHeader = true;
  @Input() maxHeight = '300px';

  @Output() messageSent = new EventEmitter<string>();
  @Output() fileSent = new EventEmitter<File>();
  @Output() fileRequest = new EventEmitter<any>();

  fileTransfers: Map<string, {
    fileId: string;
    fileName: string;
    progress: number;
    type: 'upload' | 'download';
  }> = new Map();
  private progressSubscription?: Subscription;

  @ViewChild('chatContainer') chatContainer: ElementRef | undefined = undefined;

  newMessage = '';
  selectedFile: File | null = null;
  showChatPanel = true;

  constructor(private webrtc: WebrtcService) {
  }

  ngOnInit() {
    this.progressSubscription = this.webrtc.fileTransferProgress$.subscribe((progress:any) => {
      this.fileTransfers.set(progress.fileId, progress);

      if (progress.progress === 100) {
        setTimeout(() => {
          this.fileTransfers.delete(progress.fileId);
        }, 3000);
      }
    });
  }

  ngOnDestroy() {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messageSent.emit(this.newMessage);
      this.newMessage = '';
    } else if (this.selectedFile) {
      this.sendFile();
    }
  }

  handleFileSelection(event: any) {
    const files = event.target.files;
    if (files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  sendFile() {
    if (this.selectedFile) {
      this.fileSent.emit(this.selectedFile);
      this.clearSelectedFile();
    }
  }

  clearSelectedFile() {
    this.selectedFile = null;
  }

  requestFile(fileMetadata: any) {
    this.fileRequest.emit(fileMetadata);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }

  ngOnChanges() {
    this.scrollToBottom();
  }
}
