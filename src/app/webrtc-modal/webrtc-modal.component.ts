import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { WebrtcService, ChatMessage } from "../webrtc.service";
import { FormsModule } from "@angular/forms";
import {NgbActiveModal, NgbAlert} from "@ng-bootstrap/ng-bootstrap";
import { Subscription } from 'rxjs';
import {NgClass} from "@angular/common";
import {AccountsService} from "../accounts/accounts.service";
import {ChatComponent} from "../chat/chat.component";
import {ToastService} from "../toast.service";
import {EncryptionService} from "../encryption.service";

@Component({
  selector: 'app-webrtc-modal',
  standalone: true,
  imports: [
    FormsModule,
    NgbAlert,
    ChatComponent
  ],
  templateUrl: './webrtc-modal.component.html',
  styleUrl: './webrtc-modal.component.scss'
})
export class WebrtcModalComponent implements OnInit, OnDestroy {
  connectionType: 'host'|'viewer' = 'viewer';
  connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  isLoading = false;
  allowCustomEncryption = false;
  selectedVideoDevice?: MediaDeviceInfo;
  selectedAudioDevice?: MediaDeviceInfo;
  chatMessages: ChatMessage[] = [];
  newMessage = '';
  showChatPanel = true;
  private connectionSubscription?: Subscription;
  selectedFile: File | null = null;

  private chatSubscription?: Subscription;

  encryptionEnabled = false;
  encryptionSupported = true;
  constructor(
    public webrtc: WebrtcService,
    private activeModal: NgbActiveModal,
    private accounts: AccountsService,
    public encryption: EncryptionService,
    private toastService: ToastService
  ) {
    this.webrtc.userName = this.accounts.username
  }

  async ngOnInit() {
    this.connectionType = this.webrtc.connectionType;
    this.chatSubscription = this.webrtc.chatMessages$.subscribe(
      (message: ChatMessage) => {
        if (message.senderId !== this.webrtc.unique_id) {
          this.chatMessages = [...this.chatMessages, message];
        }
      }
    )

    this.connectionSubscription = this.webrtc.connectionState$.subscribe(state => {
      this.connectionState = state;
    });

    await this.loadInputDevices();
    if (this.connectionType === 'host' && this.webrtc.enableVideo) {
      await this.webrtc.start();
    }
    this.encryptionSupported = typeof window.crypto !== 'undefined' &&
      typeof window.crypto.subtle !== 'undefined';
    this.encryption.encryptionEnabled$.subscribe((enabled:any) => {
      this.encryptionEnabled = enabled;
    });
  }

  async toggleVideo(event: boolean) {
    this.webrtc.enableVideo = event;

    if (event) {
      if (this.connectionType === 'host') {
        await this.webrtc.start();
      }
    } else {
      if (this.webrtc.stream) {
        this.webrtc.stream.getVideoTracks().forEach(track => {
          track.stop();
        });
      }
    }
  }

  ngOnDestroy() {
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
  }

  async loadInputDevices() {
    this.isLoading = true;
    try {
      const devices = await this.webrtc.getAllInputDevices();

      if (devices.video.length > 0 && !this.selectedVideoDevice) {
        this.selectedVideoDevice = devices.video[0];
        this.webrtc.selectedVideoDevice = devices.video[0];
      }

      if (devices.audio.length > 0 && !this.selectedAudioDevice) {
        this.selectedAudioDevice = devices.audio[0];
        this.webrtc.selectedAudioDevice = devices.audio[0];
      }
    } catch (error) {
      console.error("Error loading input devices:", error);
    } finally {
      this.isLoading = false;
    }
  }

  async connect() {
    if (this.connectionState === 'connected') {
      return;
    }

    try {
      this.isLoading = true;
      await this.webrtc.call(this.connectionType);
    } catch (error) {
      console.error("Error connecting:", error);
    } finally {
      this.isLoading = false;
    }
  }

  async changeInputDevice() {
    if (!this.selectedVideoDevice && !this.selectedAudioDevice) {
      return;
    }

    try {
      this.isLoading = true;
      await this.webrtc.changeMediaInput(this.selectedVideoDevice, this.selectedAudioDevice);
    } catch (error) {
      console.error("Error changing input devices:", error);
    } finally {
      this.isLoading = false;
    }
  }

  toggleAudio(event: boolean) {
    this.webrtc.enableAudio = event;
    if (event) {
      if (this.connectionState === 'connected' && this.webrtc.stream) {
        this.webrtc.stream.getAudioTracks().forEach(track => {
          track.enabled = this.webrtc.enableAudio;
        });
      }
    } else {
      if (this.webrtc.stream) {
        this.webrtc.stream.getAudioTracks().forEach(track => {
          track.stop();
        });
      }
    }


  }

  disconnect() {
    this.webrtc.end().then(() => {
      this.connectionState = 'disconnected';
    });
  }

  close() {
    if (this.connectionState !== 'disconnected') {
      this.webrtc.end().then(() => {
        this.activeModal.dismiss();
      });
    } else {
      this.activeModal.dismiss();
    }
  }

  async sendMessage(): Promise<void> {
    if (this.selectedFile) {
      const fileMetadata = {
        fileId: crypto.randomUUID(),
        fileName: this.selectedFile.name,
        fileSize: this.selectedFile.size,
        fileType: this.selectedFile.type,
        sender: this.webrtc.unique_id
      };

      this.webrtc.storeFileForSharing(fileMetadata.fileId, this.selectedFile);

      // Send as special message
      this.webrtc.sendFileMetadata(fileMetadata, this.newMessage);
      this.newMessage = '';
      this.clearSelectedFile();
    } else if (this.newMessage.trim()) {
      await this.webrtc.sendChatMessage(this.newMessage);
      this.newMessage = '';
    }
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }


  handleFileSelection(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    const fileInput = document.querySelector('input[type=file]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
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
      timestamp: Date.now()
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

  minimize() {
    this.webrtc.toggleMinimize(true);
    this.activeModal.dismiss('minimized');
  }

  disconnectAndClose() {
    this.webrtc.end().then(() => {
      this.webrtc.toggleMinimize(false);
      this.activeModal.dismiss('closed');
    });
  }

  async toggleEncryption(event: any): Promise<void> {
    await this.encryption.generateKeyPair()
    this.encryption.encryptionEnabled = event;
    this.webrtc.notifyEncryptionStatus(event);
    this.toastService.show(
      'Encryption',
      event ? 'Encryption enabled for this session.' : 'Encryption disabled for this session.',
      3000,
      'info'
    )
  }
}
