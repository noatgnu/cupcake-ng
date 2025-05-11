import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebrtcService, ChatMessage } from "../../webrtc.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { WebrtcModalComponent} from "../../webrtc-modal/webrtc-modal.component";
import {ChatComponent} from "../chat.component";
import {NgClass} from "@angular/common";


@Component({
  selector: 'app-floating-chat',
  imports: [
    ChatComponent,
    NgClass
  ],
  templateUrl: './floating-chat.component.html',
  styleUrl: './floating-chat.component.scss'
})
export class FloatingChatComponent implements OnInit, OnDestroy {
  isExpanded = true;
  chatMessages: ChatMessage[] = [];
  connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  private chatMessageSubscription: any;
  private connectionStateSubscription: any;

  constructor(
    public webrtc: WebrtcService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    // Subscribe to chat messages and connection state
    this.chatMessageSubscription = this.webrtc.chatMessages$.subscribe(msg => {
      this.chatMessages = [...this.chatMessages, msg];
      console.log(this.chatMessages);
    });
    this.connectionStateSubscription = this.webrtc.connectionState$.subscribe(state => {
      this.connectionState = state;
    });
  }

  toggleExpand(event: any) {
    event.stopPropagation();
    this.isExpanded = !this.isExpanded;
  }

  openModal(event: any) {
    event.stopPropagation();
    this.webrtc.toggleMinimize(false);
    const modalRef = this.modalService.open(WebrtcModalComponent, { size: 'lg' });
  }

  ngOnDestroy() {
    // Unsubscribe from chat messages and connection state
    if (this.chatMessageSubscription) {
      this.chatMessageSubscription.unsubscribe();
    }
    if (this.connectionStateSubscription) {
      this.connectionStateSubscription.unsubscribe();
    }
  }

  requestFile(fileMetadata: any): void {
    if (!fileMetadata || !fileMetadata.fileId || !fileMetadata.sender) return;
    this.webrtc.requestFileFromPeer(fileMetadata.fileId, fileMetadata.sender);
  }

  async onMessageSent(message: string) {
    await this.webrtc.sendChatMessage(message);
    const chatMessage: ChatMessage = {
      senderId: this.webrtc.unique_id || '',
      senderName: 'You',
      message: message,
      timestamp: Date.now(),
    };

    this.chatMessages = [...this.chatMessages, chatMessage];
  }

  onFileSent(file: File) {
    // Create a unique file ID
    const fileId = crypto.randomUUID();

    // Store the file locally first (don't send it immediately)
    this.webrtc.storeFileForSharing(fileId, file);

    // Create file metadata
    const fileMetadata = {
      fileId: fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      sender: this.webrtc.unique_id || ''
    };

    // Send metadata (not the actual file)
    this.webrtc.sendFileMetadata(fileMetadata, '');

    // Add message to chat
    const chatMessage: ChatMessage = {
      senderId: this.webrtc.unique_id || '',
      senderName: 'You',
      message: `Shared a file: ${file.name}`,
      timestamp: Date.now(),
      fileMetadata: fileMetadata
    };

    this.chatMessages = [...this.chatMessages, chatMessage];
  }
}
