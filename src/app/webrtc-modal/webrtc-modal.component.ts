import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { WebrtcService, ChatMessage } from "../webrtc.service";
import { FormsModule } from "@angular/forms";
import {NgbActiveModal, NgbAlert} from "@ng-bootstrap/ng-bootstrap";
import { Subscription } from 'rxjs';
import {NgClass} from "@angular/common";
import {AccountsService} from "../accounts/accounts.service";

@Component({
  selector: 'app-webrtc-modal',
  standalone: true,
  imports: [
    FormsModule,
    NgbAlert,
    NgClass
  ],
  templateUrl: './webrtc-modal.component.html',
  styleUrl: './webrtc-modal.component.scss'
})
export class WebrtcModalComponent implements OnInit, OnDestroy {
  connectionType: 'host'|'viewer' = 'viewer';
  connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  isLoading = false;

  // For device selection
  selectedVideoDevice?: MediaDeviceInfo;
  selectedAudioDevice?: MediaDeviceInfo;
  chatMessages: ChatMessage[] = [];
  newMessage = '';
  showChatPanel = true;
  private chatSubscription?: Subscription;
  private connectionSubscription?: Subscription;
  @ViewChild('chatContainer') chatContainer?: ElementRef;


  constructor(public webrtc: WebrtcService, private activeModal: NgbActiveModal, private accounts: AccountsService) {
    this.webrtc.userName = this.accounts.username
  }

  async ngOnInit() {
    // Get initial connection type
    this.connectionType = this.webrtc.connectionType;

    this.connectionSubscription = this.webrtc.connectionState$.subscribe(state => {
      this.connectionState = state;
    });
    this.chatSubscription = this.webrtc.chatMessages$.subscribe(message => {
      this.chatMessages.push(message);
      setTimeout(() => this.scrollToBottom(), 0);
    });

    // Load available devices
    await this.loadInputDevices();
    console.log(this.webrtc.audioDevices);
    console.log(this.webrtc.cameraDevices);
    // Initialize camera preview if host mode is selected
    if (this.connectionType === 'host' && this.webrtc.enableVideo) {
      await this.webrtc.start();
    }
  }

// Modify toggleVideo to preview immediately
  async toggleVideo(event: boolean) {
    if (event) {
      if (this.connectionType === 'host') {
        if (this.webrtc.enableVideo) {
          // Start preview immediately when enabling video
          await this.webrtc.start();
        } else if (this.webrtc.stream) {
          // Stop video tracks when disabling
          this.webrtc.stream.getVideoTracks().forEach(track => {
            track.stop();
          });
        }
      }
    }
  }

  ngOnDestroy() {
    // Clean up subscription
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

      // Pre-select the first device of each type if available
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
    if (event) {
      if (this.connectionState === 'connected' && this.webrtc.stream) {
        // Toggle audio tracks
        this.webrtc.stream.getAudioTracks().forEach(track => {
          track.enabled = this.webrtc.enableAudio;
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

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    this.webrtc.sendChatMessage(this.newMessage);
    this.newMessage = '';
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  private scrollToBottom(): void {
    if (this.chatContainer) {
      const element = this.chatContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
}
