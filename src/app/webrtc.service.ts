import { Injectable, NgZone } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from "../environments/environment";
import { AccountsService } from "./accounts/accounts.service";
import { WebService } from "./web.service";
import { BehaviorSubject, firstValueFrom, Subscription, Subject } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { ToastService } from './toast.service';
import {EncryptionService} from "./encryption.service";
import jsSHA from "jssha";

export interface ChatMessage {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  encrypted?: boolean;
  fileMetadata?: {
    fileId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    sender: string;
  };
}

interface FileChunk {
  fileId: string;
  fileName: string;
  chunkIndex: number;
  totalChunks: number;
  data: ArrayBuffer;
  mimeType?: string;
}

interface FileTransfer {
  fileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  chunks: ArrayBuffer[];
  receivedChunks: number;
  sending: boolean;
  fileHash?: string;
}

interface PeerConnection {
  pc: RTCPeerConnection;
  offered: boolean;
  answered: boolean;
  connectionType: 'viewer' | 'host';
  connected: boolean;
  dataChannel?: RTCDataChannel;
  queuedCandidates: RTCIceCandidate[];
}

@Injectable({
  providedIn: 'root'
})
export class WebrtcService {
  private _chatMessages = new Subject<ChatMessage>();
  chatMessages$ = this._chatMessages.asObservable();
  userName: string = 'User';
  private fileTransfers: Map<string, FileTransfer> = new Map();
  private chunkSize = 262144;
  private availableFiles: Map<string, File> = new Map();
  private _fileTransferProgress = new Subject<{
    fileId: string;
    fileName: string;
    progress: number;
    type: 'upload' | 'download';
    peerId?: string;
    encrypted?: boolean;
  }>();
  lastChunkHeader: {
    fileId: string;
    chunkIndex: number;
    totalChunks: number;
  } | null = null;
  fileTransferProgress$ = this._fileTransferProgress.asObservable();

  // Media devices
  selectedVideoDevice?: MediaDeviceInfo;
  selectedAudioDevice?: MediaDeviceInfo;
  cameraDevices: MediaDeviceInfo[] = [];
  audioDevices: MediaDeviceInfo[] = [];

  // Connection state
  private _connectionState = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');
  connectionState$ = this._connectionState.asObservable();

  // Peer connection
  private signallingConnection?: WebSocketSubject<any>;
  private connectionCheckInterval?: number;
  private signallingSubscription?: Subscription;

  // WebRTC state
  baseURL = environment.baseURL;
  makingOffer = false;
  polite = true;
  ignoreOffer = false;
  stream?: MediaStream;
  unique_id?: string;
  session_id?: string;
  searchingForPeers = false;
  peerConnectionMap: {[key: string]: PeerConnection} = {};
  peerList: string[] = [];
  acceptCall = false;

  // User preferences
  constraints: MediaStreamConstraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
    audio: true,
  };
  enableVideo = false;
  enableAudio = false;
  connectionType: 'viewer'|'host' = 'viewer';
  isCallerMap: {[key: string]: boolean} = {};

  isMinimized = false;

  constructor(
    private accounts: AccountsService,
    private web: WebService,
    private zone: NgZone,
    private toastService: ToastService,
    private encryption: EncryptionService
  ) {}

  get connected(): boolean {
    return this._connectionState.value === 'connected';
  }

  set connected(value: boolean) {
    this._connectionState.next(value ? 'connected' : 'disconnected');
  }

  toggleMinimize(state: boolean) {
    this.isMinimized = state;
  }

  async exchangePublicKey(peerId: string): Promise<void> {
    if (!this.peerConnectionMap[peerId]?.dataChannel ||
      this.peerConnectionMap[peerId].dataChannel?.readyState !== 'open') {
      return;
    }

    // Make sure we have a key pair generated
    if (!this.encryption.keyPair) {
      await this.encryption.generateKeyPair();
    }

    const publicKeyString = await this.encryption.exportPublicKey();
    if (!publicKeyString) return;

    this.peerConnectionMap[peerId].dataChannel?.send(JSON.stringify({
      type: 'public-key',
      data: publicKeyString
    }));
  }

  /**
   * Connect to signalling server
   */
  connect(sessionID: string) {
    // Close any existing connection first
    this.closeSignallingConnection();

    // Store session ID for later use
    this.session_id = sessionID;

    // Create new connection
    this.signallingConnection = this.createSignallingConnection(sessionID);
  }

  /**
   * Create peer connection with STUN/TURN servers properly configured
   */
  private async createPeerConnection(connectionID: string = "", autonegotiate: boolean = true): Promise<RTCPeerConnection> {
    try {
      // Get TURN credentials
      const credential = await firstValueFrom(this.web.getCoturnCredentials().pipe(
        take(1),
        catchError(error => {
          console.error("Error getting TURN credentials:", error);
          throw error;
        })
      ));

      // Configure ICE servers with both STUN and TURN
      const configuration: RTCConfiguration = {
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302"
          },
          //{
          //  urls: credential.urls,
          //  username: credential.username,
          //  credential: credential.credential
          //}
        ],
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
      };

      const pc = new RTCPeerConnection(configuration);

      // Create data channel
      const dataChannel = pc.createDataChannel('dataChannel', {
        ordered: true
      });

      this.setupDataChannelHandlers(dataChannel, connectionID);

      // Configure transceiver direction based on connection type
      if (this.connectionType === 'viewer') {
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });
      } else if (this.connectionType === 'host' && this.stream) {
        this.stream.getTracks().forEach(track => {
          pc.addTrack(track, this.stream!);
        });
      }

      // Set up event handlers
      this.setupPeerConnectionHandlers(pc, connectionID, autonegotiate);

      return pc;
    } catch (error) {
      console.error("Error creating peer connection:", error);
      this.toastService.show("Connection Error", "Failed to establish WebRTC connection. Please try again.", 1000, "danger");
      throw error;
    }
  }

  /**
   * Set up data channel event handlers
   */
  private setupDataChannelHandlers(dataChannel: RTCDataChannel, connectionID: string) {
    dataChannel.onopen = () => {
      console.log(`Data channel with peer ${connectionID} opened`);
      if (this.encryption.isEncryptionEnabled) {
        this.exchangePublicKey(connectionID);
      }

      if (this.peerConnectionMap[connectionID]?.connected) {
        // Send a system message to notify connection
        this._chatMessages.next({
          senderId: 'system',
          senderName: 'System',
          message: `Peer ${connectionID} connected`,
          timestamp: Date.now()
        });
      }
    };

    dataChannel.onmessage = async (event) => {
      //console.log(`Data received from peer ${connectionID}:`, event.data);
      if (event.data instanceof ArrayBuffer) {
        // Use the last received header to process this chunk
        if (this.lastChunkHeader) {
          const { fileId, chunkIndex, totalChunks } = this.lastChunkHeader;
          console.log(`Processing binary chunk ${chunkIndex + 1} of ${totalChunks} for file ${fileId}`);
          this.processFileChunk(fileId, chunkIndex, event.data, connectionID);
          this.lastChunkHeader = null; // Clear after use
        } else {
          console.error("Received binary data without header information");
        }
        return;
      }

      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'file-chunk-header':
            console.log(`Received header for chunk ${data.chunkIndex + 1} of ${data.totalChunks}`);

            // Store the header for the next binary message
            this.lastChunkHeader = {
              fileId: data.fileId,
              chunkIndex: data.chunkIndex,
              totalChunks: data.totalChunks
            };
            if (data.chunkId) {
              dataChannel.send(JSON.stringify({
                type: 'chunk-header-ack',
                chunkId: data.chunkId
              }));
            }
            break;
          case 'file-chunk-encrypted':
            // Handle encrypted file chunk
            if (this.encryption.isEncryptionEnabled) {
              const decrypted = await this.encryption.decryptData(data.data);
              if (decrypted) {
                const messsageData = JSON.parse(decrypted);
                this.handleFileChunk(messsageData, connectionID);
              }

            }
            break;
          case 'encryption-status':
            if (data.enabled) {
              const success = await this.encryption.importPeerPublicKey(connectionID, data.publicKey);
              if (success) {
                if (this.encryption.isEncryptionEnabled) {
                  await this.exchangePublicKey(connectionID);
                }

                this._chatMessages.next({
                  senderId: 'system',
                  senderName: 'System',
                  message: `Peer ${connectionID} enabled end-to-end encryption`,
                  timestamp: Date.now()
                });
              }
            } else {
              this.encryption.removePeerPublicKey(connectionID);
              this._chatMessages.next({
                senderId: 'system',
                senderName: 'System',
                message: `Peer ${connectionID} disabled end-to-end encryption`,
                timestamp: Date.now()
              });
            }
            break

          case 'public-key':
            const success = await this.encryption.importPeerPublicKey(connectionID, data.data);
            if (success) {
              if (!this.encryption.hasCompletedKeyExchange(connectionID)) {
                await this.exchangePublicKey(connectionID);
              }
              this._chatMessages.next({
                senderId: 'system',
                senderName: 'System',
                message: `End-to-end encryption enabled with peer ${connectionID}`,
                timestamp: Date.now()
              });
            }
            break;
          case 'chat':
            this.zone.run( async () => {
              let messageData = data.data;
              let wasEncrypted = false;
              if (typeof data.data === 'string') {
                if (this.encryption.isEncryptionEnabled && this.encryption.isEncryptedMessage(data.data)) {
                  console.log(data.data)
                  const decrypted = await this.encryption.decryptData(data.data);
                  wasEncrypted = true;
                  if (decrypted) {
                    try {
                      messageData = JSON.parse(decrypted);
                      try {
                        messageData = JSON.parse(messageData);
                      } catch (e) {
                        console.error("Failed to parse decrypted message", e);
                      }
                    } catch (e) {
                      console.error("Failed to parse decrypted message", e);
                    }
                  }
                } else {
                  try {
                    messageData = JSON.parse(data.data);
                  } catch (e) {
                    console.error("Failed to parse message data", e);
                  }
                }
              }
              if (messageData) {
                messageData.encrypted = wasEncrypted;
              }

              this._chatMessages.next(messageData);
            });
            break;
          case 'file-start':
            const fileTransfer: FileTransfer = {
              fileId: data.data.fileId,
              fileName: data.data.fileName,
              mimeType: data.data.mimeType || 'application/octet-stream',
              size: data.data.size || 0,
              chunks: new Array(data.data.totalChunks),
              receivedChunks: 0,
              sending: false,
              fileHash: data.data.fileHash
            };

            this.fileTransfers.set(data.data.fileId, fileTransfer);
            break;
          case 'file-chunk':
            if (data.data && this.encryption.isEncryptionEnabled && data.encrypted) {
              const decrypted = await this.encryption.decryptData(data.data);
              if (decrypted) {
                try {
                  const chunkData = JSON.parse(decrypted);
                  this.handleFileChunk(chunkData, connectionID);
                } catch (e) {
                  console.error("Failed to parse decrypted chunk data", e);
                }
              }
            } else {
              this.handleFileChunk(data.data, connectionID);
            }
            break;
          case 'file-request':
            // Handle incoming file request
            this.zone.run(() => {
              this.sendFileToPeer(data.data.fileId, data.data.requesterId);
            });
            break;
        }
      } catch (e) {
        console.error('Error parsing message data', e);
      }
    };

    dataChannel.onclose = () => {
      console.log(`Data channel with peer ${connectionID} closed`);

      // Send a system message about disconnection
      this._chatMessages.next({
        senderId: 'system',
        senderName: 'System',
        message: `Peer ${connectionID} disconnected`,
        timestamp: Date.now()
      });
    };

    dataChannel.onerror = (error) => {
      console.error(`Data channel error with peer ${connectionID}:`, error);
    };
  }

  /**
   * Set up peer connection event handlers
   */
  private setupPeerConnectionHandlers(pc: RTCPeerConnection, connectionID: string, autonegotiate: boolean) {
    // ICE candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && connectionID && this.signallingConnection) {
        this.signallingConnection.next({
          type: 'candidate',
          candidate: event.candidate,
          to: connectionID,
          id_type: this.connectionType
        });
      }
    };

    // Negotiation needed
    pc.onnegotiationneeded = async () => {
      if (!autonegotiate || !this.isCallerMap[connectionID] || pc.signalingState !== 'stable') {
        return;
      }

      try {
        this.makingOffer = true;
        await pc.setLocalDescription(await pc.createOffer());

        if (this.signallingConnection && pc.localDescription) {
          this.signallingConnection.next({
            type: 'offer',
            sdp: pc.localDescription.sdp,
            to: connectionID,
            id_type: this.connectionType
          });
        }
      } catch (error) {
        console.error("Error during negotiation:", error);
      } finally {
        this.makingOffer = false;
      }
    };

    // ICE connection state change
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with peer ${connectionID}: ${pc.iceConnectionState}`);

      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        this.handleConnectionFailure(pc, connectionID);
      }
    };

    // Connection state change
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with peer ${connectionID}: ${pc.connectionState}`);

      if (pc.connectionState === 'connected') {
        this.zone.run(() => {
          this.connected = true;
          if (this.peerConnectionMap[connectionID]) {
            this.peerConnectionMap[connectionID].connected = true;
            if (!this.peerList.includes(connectionID)) {
              this.peerList.push(connectionID);
            }
          }
        });
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.zone.run(() => {
          this.cleanupPeerConnection(connectionID);

          // Check if we have any remaining connections
          if (Object.keys(this.peerConnectionMap).length === 0) {
            this.connected = false;
          }
        });
      }
    };

    // Data channel reception
    pc.ondatachannel = (event) => {
      const receivedChannel = event.channel;
      this.setupDataChannelHandlers(receivedChannel, connectionID);

      if (this.peerConnectionMap[connectionID]) {
        this.peerConnectionMap[connectionID].dataChannel = receivedChannel;
      }
    };

    // Track reception
    pc.ontrack = ({track, streams}) => {
      track.onunmute = () => {
        this.handleTrackUnmute(connectionID, streams[0]);
      };

      track.onmute = () => {
        console.log(`Track from peer ${connectionID} muted`);
      };

      track.onended = () => {
        console.log(`Track from peer ${connectionID} ended`);
      };
    };
  }

  /**
   * Handle track unmute by attaching to video element
   */
  private handleTrackUnmute(connectionID: string, stream: MediaStream) {
    this.zone.run(() => {
      const videoElementId = `webrtc-${connectionID}`;
      const videoElement = document.getElementById(videoElementId) as HTMLVideoElement;

      if (videoElement) {
        this.attachStreamToVideo(videoElement, stream);
      } else {
        // Check for element every 250ms
        const checkInterval = window.setInterval(() => {
          const element = document.getElementById(videoElementId) as HTMLVideoElement;
          if (element) {
            this.attachStreamToVideo(element, stream);
            window.clearInterval(checkInterval);
          }
        }, 250);

        // Clean up interval after 5 seconds if element is never found
        setTimeout(() => window.clearInterval(checkInterval), 5000);
      }
    });
  }

  /**
   * Attach media stream to video element
   */
  private attachStreamToVideo(videoElement: HTMLVideoElement, stream: MediaStream) {
    videoElement.srcObject = stream;
    videoElement.oncanplaythrough = () => {
      videoElement.muted = true;
      videoElement.play().catch(error => {
        console.error("Error playing video:", error);
      });
    };
  }

  /**
   * Handle connection failure with diagnostics
   */
  private handleConnectionFailure(pc: RTCPeerConnection, connectionID: string) {
    console.log("Connection failed, gathering stats");

    pc.getStats().then(stats => {
      let failureReason = "Unknown reason";

      stats.forEach(report => {
        if (report.type === 'candidate-pair' && report.state === 'failed') {
          failureReason = `ICE candidate pair failed: local=${report.localCandidateId}, remote=${report.remoteCandidateId}`;
        }
      });

      console.error(`Connection with peer ${connectionID} failed: ${failureReason}`);
    }).catch(error => {
      console.error("Error getting stats:", error);
    });
  }

  /**
   * Create signalling connection to backend
   */
  private createSignallingConnection(sessionID: string): WebSocketSubject<any> {
    const wsUrl = `${this.baseURL}/ws/webrtc_signal/${sessionID}/?token=${this.accounts.token}`.replace("http", "ws");

    const ws = webSocket({
      url: wsUrl,
      openObserver: {
        next: () => {
          console.log("Signalling connection opened");
        }
      },
      closeObserver: {
        next: () => {
          console.log("Signalling connection closed");
        }
      },
      deserializer: msg => {
        try {
          return JSON.parse(msg.data);
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
          return msg.data;
        }
      }
    });

    // Subscribe to messages
    this.signallingSubscription = ws.subscribe({
      next: async (data: any) => {
        try {
          await this.handleSignallingMessage(data);
        } catch (error) {
          console.error("Error handling signalling message:", error);
        }
      },
      error: error => {
        console.error("Signalling connection error:", error);
        this._connectionState.next('disconnected');

        // Auto-reconnect after a delay
        setTimeout(() => {
          if (this.acceptCall && this.session_id) {
            this.connect(this.session_id);
          }
        }, 5000);
      },
      complete: () => {
        console.log("Signalling connection closed");
      }
    });

    return ws;
  }

  /**
   * Handle incoming signalling messages
   */
  private async handleSignallingMessage(data: any) {
    // Handle initial connection message
    if (data.message) {
      if (data.unique_id) {
        this.unique_id = data.unique_id;
      }
      return;
    }

    const { type, sdp, candidate, from, id_type } = data;

    if (!this.acceptCall) return;

    switch (type) {
      case 'check':
        if (from && from !== this.unique_id) {
          // A new peer is checking for connections
          await this.handleCheckMessage(from, id_type);
        }
        break;

      case 'offer':
        if (from && sdp) {
          await this.handleOffer(from, sdp, id_type);
        }
        break;

      case 'answer':
        if (from && sdp) {
          await this.handleAnswer(from, sdp);
        }
        break;

      case 'candidate':
      case 'ice':
        if (from && candidate) {
          await this.handleCandidate(from, candidate);
        }
        break;
    }
  }

  /**
   * Handle check message from peer
   */
  private async handleCheckMessage(from: string, peerType?: string) {
    // If we don't have a connection to this peer yet, create one
    if (!this.peerConnectionMap[from]) {
      console.log(`Received check from new peer ${from} with type ${peerType}`);

      // Create peer connection
      const pc = await this.createPeerConnection(from, false);

      // Validate connection type to ensure type safety
      const connectionType: 'viewer' | 'host' =
        peerType === 'host' ? 'host' : 'viewer';

      // Add to our map
      this.peerConnectionMap[from] = {
        pc,
        offered: false,
        answered: false,
        connectionType, // Now type-safe
        connected: false,
        queuedCandidates: []
      };

      // Determine who should be the caller (host initiates to viewers)
      this.isCallerMap[from] = this.connectionType === 'host' && connectionType === 'viewer';

      // If we're the host, we should initiate
      if (this.isCallerMap[from]) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          if (pc.localDescription && this.signallingConnection) {
            this.signallingConnection.next({
              type: 'offer',
              sdp: pc.localDescription.sdp,
              to: from,
              id_type: this.connectionType
            });
            this.peerConnectionMap[from].offered = true;
          }
        } catch (error) {
          console.error("Error creating offer after check:", error);
        }
      }
    }
  }

  /**
   * Handle incoming offer
   */
  private async handleOffer(from: string, sdp: RTCSessionDescriptionInit, peerType?: string) {
    // Create peer connection if it doesn't exist
    if (!this.peerConnectionMap[from]) {
      const pc = await this.createPeerConnection(from, false);

      // Validate connection type to ensure type safety
      const connectionType: 'viewer' | 'host' =
        peerType === 'host' ? 'host' : 'viewer';

      this.peerConnectionMap[from] = {
        pc,
        offered: false,
        answered: false,
        connectionType, // Now type-safe
        connected: false,
        queuedCandidates: []
      };

      // Viewer responds to host offers
      this.isCallerMap[from] = false;
    }

    const pc = this.peerConnectionMap[from].pc;

    try {
      // If we're in the middle of our own negotiation, handle collision
      const isStable = pc.signalingState === 'stable' ||
        (pc.signalingState === 'have-local-offer' && this.makingOffer);

      this.ignoreOffer = !this.polite && !isStable;

      if (this.ignoreOffer) {
        console.log("Ignoring offer due to collision");
        return;
      }

      // If we're not in a stable state, we need to rollback
      if (pc.signalingState !== 'stable') {
        await pc.setLocalDescription({type: 'rollback'});
      }

      // Set remote description first with the offer
      await pc.setRemoteDescription({type: 'offer', sdp: sdp.sdp});

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (this.signallingConnection && pc.localDescription) {
        this.signallingConnection.next({
          type: 'answer',
          sdp: pc.localDescription.sdp,
          to: from,
          id_type: this.connectionType
        });

        this.peerConnectionMap[from].answered = true;
      }

      // Process any queued candidates
      if (this.peerConnectionMap[from].queuedCandidates.length > 0) {
        await Promise.all(this.peerConnectionMap[from].queuedCandidates.map(async (candidate) => {
          await pc.addIceCandidate(candidate);
        }));
        this.peerConnectionMap[from].queuedCandidates = [];
      }
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  }

  /**
   * Handle incoming answer
   */
  private async handleAnswer(from: string, sdp: RTCSessionDescriptionInit) {
    if (!this.peerConnectionMap[from]) {
      console.warn(`Received answer from unknown peer ${from}`);
      return;
    }

    try {
      const pc = this.peerConnectionMap[from].pc;
      await pc.setRemoteDescription({type: 'answer', sdp: sdp.sdp});

      // Process queued candidates
      if (this.peerConnectionMap[from].queuedCandidates.length > 0) {
        await Promise.all(this.peerConnectionMap[from].queuedCandidates.map(async (candidate) => {
          await pc.addIceCandidate(candidate);
        }));
        this.peerConnectionMap[from].queuedCandidates = [];
      }
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  private async handleCandidate(from: string, candidate: RTCIceCandidate) {
    if (!this.peerConnectionMap[from]) {
      console.warn(`Received ICE candidate from unknown peer ${from}`);
      return;
    }

    try {
      const pc = this.peerConnectionMap[from].pc;

      if (pc.remoteDescription) {
        await pc.addIceCandidate(candidate);
      } else {
        // Queue the candidate for later
        this.peerConnectionMap[from].queuedCandidates.push(candidate);
      }
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  }

  /**
   * Start local media stream
   */
  async start() {
    try {
      // Update constraints based on user preferences
      this.updateMediaConstraints();

      console.log("Starting media with constraints:", this.constraints);

      // Only get media if video or audio is enabled
      if (this.enableVideo || this.enableAudio) {
        // Stop any existing stream
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }

        // Get new stream
        this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);
        console.log("Stream obtained:", this.stream);

        // Attach to local preview
        const localVideoElement = document.getElementById('webrtc-local') as HTMLVideoElement;
        if (localVideoElement) {
          console.log("Attaching stream to video element");
          localVideoElement.srcObject = this.stream;
          localVideoElement.onloadedmetadata = () => {
            localVideoElement.play().catch(e => console.error("Error playing video:", e));
          };
        } else {
          console.warn("Local video element not found");
        }
      }
    } catch (error: any) {
      console.error("Error accessing media devices:", error);
      this.toastService.show("Media Error", "Could not access camera or microphone: " + error.message, 1000, "danger");
    }
  }
  /**
   * Update media constraints based on device selection
   */
  private updateMediaConstraints() {
    this.constraints = {
      video: this.enableVideo ? {
        deviceId: this.selectedVideoDevice?.deviceId,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      } : false,
      audio: this.enableAudio ? {
        deviceId: this.selectedAudioDevice?.deviceId
      } : false,
    };
  }

  /**
   * Initiate WebRTC call
   */
  async call(connectionType: 'viewer'|'host') {
    try {
      this._connectionState.next('connecting');
      this.acceptCall = true;
      this.connectionType = connectionType;

      // Start media if host
      if (connectionType === 'host') {
        await this.start();
      }

      this.searchingForPeers = true;

      // Send availability check
      if (this.signallingConnection && this.unique_id) {
        this.signallingConnection.next({
          type: 'check',
          id_type: connectionType
        });
      }

      // Start monitoring connections
      this.startConnectionMonitoring();

    } catch (error) {
      console.error("Error initiating call:", error);
      this._connectionState.next('disconnected');
      this.toastService.show("Call Error", "Failed to start call.", 1000, "danger");
    }
  }

  /**
   * Start monitoring peer connections
   */
  private startConnectionMonitoring() {
    // Clear any existing interval
    if (this.connectionCheckInterval) {
      window.clearInterval(this.connectionCheckInterval);
    }

    // Monitor every 5 seconds
    this.connectionCheckInterval = window.setInterval(() => {
      // Send check message periodically to discover new peers
      if (this.signallingConnection && this.searchingForPeers) {
        this.signallingConnection.next({
          type: 'check',
          id_type: this.connectionType
        });
      }

      // Check existing connections
      for (const peer in this.peerConnectionMap) {
        const peerConnection = this.peerConnectionMap[peer];

        if (peerConnection.pc.connectionState === 'disconnected' ||
          peerConnection.pc.connectionState === 'failed' ||
          peerConnection.pc.iceConnectionState === 'disconnected' ||
          peerConnection.pc.iceConnectionState === 'failed') {

          console.log(`Cleaning up disconnected peer ${peer}`);
          this.cleanupPeerConnection(peer);

          // Try to reconnect if we're still in a call
          if (this.acceptCall && this.signallingConnection) {
            this.signallingConnection.next({
              type: 'check',
              id_type: this.connectionType
            });
          }
        }
      }
    }, 5000);
  }

  /**
   * Clean up a specific peer connection
   */
  private cleanupPeerConnection(peerId: string) {
    if (this.peerConnectionMap[peerId]) {
      this.peerConnectionMap[peerId].pc.close();
      delete this.peerConnectionMap[peerId];

      this.peerList = this.peerList.filter(p => p !== peerId);
    }
  }

  /**
   * End the call and clean up all resources
   */
  async end() {
    try {
      this._connectionState.next('disconnected');
      this.acceptCall = false;
      this.searchingForPeers = false;

      // Stop media tracks
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = undefined;
      }

      // Clean up peer connections
      Object.keys(this.peerConnectionMap).forEach(peer => {
        this.peerConnectionMap[peer].pc.close();
      });

      this.peerConnectionMap = {};
      this.peerList = [];
      this.isCallerMap = {};

      // Clear monitoring interval
      if (this.connectionCheckInterval) {
        window.clearInterval(this.connectionCheckInterval);
        this.connectionCheckInterval = undefined;
      }
      this.encryption.reset();
      return Promise.resolve();
    } catch (error) {
      console.error("Error ending call:", error);
      return Promise.reject(error);
    }
  }

  /**
   * Close the signalling connection
   */
  private closeSignallingConnection() {
    if (this.signallingSubscription) {
      this.signallingSubscription.unsubscribe();
      this.signallingSubscription = undefined;
    }

    if (this.signallingConnection) {
      this.signallingConnection.complete();
      this.signallingConnection = undefined;
    }
  }

  /**
   * Change input devices
   */
  async changeMediaInput(videoInput?: MediaDeviceInfo, audioInput?: MediaDeviceInfo) {
    try {
      this.selectedVideoDevice = videoInput;
      this.selectedAudioDevice = audioInput;

      // Update constraints with new device IDs
      this.updateMediaConstraints();

      // Only proceed if video or audio enabled
      if (this.enableVideo || this.enableAudio) {
        // Stop the current tracks
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }

        // Get new stream
        this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);

        // Update local preview
        const videoPreviewElement = document.getElementById('webrtc-local') as HTMLVideoElement;
        if (videoPreviewElement) {
          this.attachStreamToVideo(videoPreviewElement, this.stream);
        }

        // Replace tracks in all active peer connections
        this.replaceTracksInAllPeers();
      }
    } catch (error) {
      console.error("Error changing media input:", error);
      this.toastService.show("Device Error", "Failed to switch input device.", 1000, "danger");
    }
  }

  /**
   * Replace tracks in all peer connections
   */
  private replaceTracksInAllPeers() {
    if (!this.stream) return;

    for (const peerId in this.peerConnectionMap) {
      const pc = this.peerConnectionMap[peerId].pc;
      const senders = pc.getSenders();

      this.stream.getTracks().forEach(track => {
        const sender = senders.find(s => s.track?.kind === track.kind);

        if (sender) {
          sender.replaceTrack(track).catch(error => {
            console.error(`Error replacing ${track.kind} track:`, error);
          });
        } else {
          pc.addTrack(track, this.stream!);
        }
      });
    }
  }

  /**
   * Fetch available input devices
   */
  async getAllInputDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      this.cameraDevices = devices.filter(device => device.kind === 'videoinput');
      this.audioDevices = devices.filter(device => device.kind === 'audioinput');

      return { video: this.cameraDevices, audio: this.audioDevices };
    } catch (error) {
      console.error("Error enumerating devices:", error);
      return { video: [], audio: [] };
    }
  }

  async sendChatMessage(message: string): Promise<void> {
    if (!message.trim()) return;

    // Create message initially with encrypted: false
    const chatMessage: ChatMessage = {
      senderId: this.unique_id || 'local',
      senderName: this.userName,
      message: message.trim(),
      timestamp: Date.now(),
      encrypted: false
    };

    const localMessageCopy = {...chatMessage};
    this._chatMessages.next(localMessageCopy);

    let wasActuallyEncrypted = false;

    for (const peerId of Object.keys(this.peerConnectionMap)) {
      const connection = this.peerConnectionMap[peerId];
      if (connection.dataChannel && connection.dataChannel.readyState === 'open') {
        let messageData = JSON.stringify(chatMessage);

        if (this.encryption.hasPeerPublicKey(peerId)) {
          const encrypted = await this.encryption.encryptData(peerId, messageData);
          if (encrypted) {
            messageData = encrypted;
            wasActuallyEncrypted = true;
          }
        }

        connection.dataChannel.send(JSON.stringify({
          type: 'chat',
          data: messageData
        }));
      }
    }

    if (wasActuallyEncrypted) {
      localMessageCopy.encrypted = true;
      this._chatMessages.next({...localMessageCopy});
    }
  }

  async sendFile(file: File): Promise<void> {
    const fileId = crypto.randomUUID();
    const arrayBuffer = await file.arrayBuffer();
    const totalChunks = Math.ceil(arrayBuffer.byteLength / this.chunkSize);

    this.fileTransfers.set(fileId, {
      fileId,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      chunks: [],
      receivedChunks: 0,
      sending: true
    });

    // Notify peers about incoming file
    this.broadcastToDataChannels({
      type: 'file-start',
      data: {
        fileId,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        totalChunks
      }
    });

    // Send file in chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, arrayBuffer.byteLength);
      const chunk = arrayBuffer.slice(start, end);

      // Send to all peers
      this.broadcastToDataChannels({
        type: 'file-chunk',
        data: {
          fileId,
          fileName: file.name,
          chunkIndex: i,
          totalChunks,
          data: chunk,
          mimeType: file.type
        }
      });

      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private broadcastToDataChannels(message: any): void {
    Object.keys(this.peerConnectionMap).forEach(peerId => {
      const connection = this.peerConnectionMap[peerId];
      if (connection.dataChannel?.readyState === 'open') {
        connection.dataChannel.send(JSON.stringify(message));
      }
    });
  }

  storeFileForSharing(fileId: string, file: File): void {
    this.availableFiles.set(fileId, file);
  }

  sendFileMetadata(fileMetadata: any, message: string): void {
    const chatMessage: ChatMessage = {
      senderId: this.unique_id || 'local',
      senderName: this.userName,
      message: message || `Shared file: ${fileMetadata.fileName}`,
      timestamp: Date.now(),
      fileMetadata
    };

    this.broadcastToDataChannels({
      type: 'chat',
      data: chatMessage
    });

    this._chatMessages.next(chatMessage);
  }

  async sendFileToPeer(fileId: string, peerId: string): Promise<void> {
    const file = this.availableFiles.get(fileId);
    if (!file || !this.peerConnectionMap[peerId]?.dataChannel) {
      console.error("File not available or peer not connected");
      return;
    }

    const dataChannel = this.peerConnectionMap[peerId].dataChannel;
    const arrayBuffer = await file.arrayBuffer();
    const totalChunks = Math.ceil(arrayBuffer.byteLength / this.chunkSize);

    // Calculate file hash before sending
    const hashObj = new jsSHA("SHA-256", "ARRAYBUFFER");
    hashObj.update(arrayBuffer);
    const fileHash = hashObj.getHash("HEX");
    console.log(`File hash for ${file.name}: ${fileHash}`);

    const shouldEncrypt = this.encryption.hasPeerPublicKey(peerId);

    // Notify peer about incoming file with hash
    dataChannel.send(JSON.stringify({
      type: 'file-start',
      data: {
        fileId,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        totalChunks,
        encrypted: shouldEncrypt,
        fileHash
      }
    }));

    // Send file in chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, arrayBuffer.byteLength);
      const chunk = arrayBuffer.slice(start, end);

      if (shouldEncrypt) {
        // For encrypted transfers, we need to send a special format
        // Convert to base64 string to maintain compatibility with encryption
        const base64Data = btoa(
          new Uint8Array(chunk).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const chunkMetadata = {
          fileId,
          fileName: file.name,
          chunkIndex: i,
          totalChunks,
          base64Data: base64Data,  // Use base64 string instead of array
          mimeType: file.type
        };

        const encrypted = await this.encryption.encryptData(peerId, JSON.stringify(chunkMetadata));
        if (encrypted) {
          dataChannel.send(JSON.stringify({
            type: 'file-chunk',
            data: encrypted,
            encrypted: true
          }));
        }
      } else {
        const chunkId = `${fileId}-${i}`;
        // For unencrypted transfer, use binary data
        dataChannel.send(JSON.stringify({
          type: 'chunk-header-ack',
          chunkId
        }));
        const headerMessage = JSON.stringify({
          type: 'file-chunk-header',
          fileId,
          chunkIndex: i,
          totalChunks,
          fileName: file.name,
          mimeType: file.type,
          chunkId
        });

        dataChannel.send(headerMessage);
        await new Promise<void>((resolve) => {
          const ackHandler = (event: MessageEvent) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'chunk-header-ack' && data.chunkId === chunkId) {
                dataChannel.removeEventListener('message', ackHandler);
                resolve();
              }
            } catch (e) {
            }
          };
          dataChannel.addEventListener('message', ackHandler);

          // Set timeout in case acknowledgment is lost
          setTimeout(() => {
            dataChannel.removeEventListener('message', ackHandler);
            console.log(`No ack received for chunk ${i}, sending anyway`);
            resolve();
          }, 500);
        });
        dataChannel.send(chunk);

        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Update progress
      if (i % 10 === 0 || i === totalChunks - 1) {
        this.zone.run(() => {
          const progress = Math.round(((i + 1) / totalChunks) * 100);
          this._fileTransferProgress.next({
            fileId, fileName: file.name, progress,
            type: 'upload', peerId, encrypted: shouldEncrypt
          });
        });
      }
    }
  }

  private handleFileChunk(chunk: any, fromPeer: string): void {
    console.log(chunk)
    let fileTransfer = this.fileTransfers.get(chunk.fileId);

    if (!fileTransfer) {
      fileTransfer = {
        fileId: chunk.fileId,
        fileName: chunk.fileName,
        mimeType: chunk.mimeType || 'application/octet-stream',
        size: 0,
        chunks: new Array(chunk.totalChunks),
        receivedChunks: 0,
        sending: false
      };
      this.fileTransfers.set(chunk.fileId, fileTransfer);
    }

    let bufferData: ArrayBuffer;
    if (chunk.base64Data) {
      // Convert base64 back to ArrayBuffer
      const binary = atob(chunk.base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      bufferData = bytes.buffer;
    } else if (Array.isArray(chunk.data)) {
      bufferData = new Uint8Array(chunk.data).buffer;
    } else {
      bufferData = chunk.data;
    }

    fileTransfer.chunks[chunk.chunkIndex] = bufferData;
    fileTransfer.receivedChunks++;

    // Calculate and emit progress
    const progress = Math.round((fileTransfer.receivedChunks / chunk.totalChunks) * 100);
    this.zone.run(() => {
      this._fileTransferProgress.next({
        fileId: chunk.fileId,
        fileName: chunk.fileName,
        progress,
        type: 'download',
        peerId: fromPeer
      });
    });
    console.log(`Received chunk ${chunk.chunkIndex + 1} of ${chunk.totalChunks} for file ${chunk.fileId}`);
    if (fileTransfer.receivedChunks === chunk.totalChunks) {
      this.assembleFile(fileTransfer);
    }
  }

  private assembleFile(fileTransfer: FileTransfer): void {
    const blob = new Blob(fileTransfer.chunks, { type: fileTransfer.mimeType });
    const url = URL.createObjectURL(blob);
    let integrityMessage = '';
    if (fileTransfer.fileHash) {
      const calculatedHash = this.calculateHash(fileTransfer.chunks);
      const hashValid = calculatedHash === fileTransfer.fileHash;
      integrityMessage = hashValid
        ? " (Integrity verified ✓)"
        : " (WARNING: Integrity check failed ✗)";
    }

    this.zone.run(() => {
      this._chatMessages.next({
        senderId: 'system',
        senderName: 'System',
        message: `File received: ${fileTransfer.fileName}${integrityMessage}`,
        timestamp: Date.now()
      });

      const a = document.createElement('a');
      a.href = url;
      a.download = fileTransfer.fileName;
      a.click();
    });
  }

  requestFileFromPeer(fileId: string, senderId: string): void {
    if (!this.peerConnectionMap[senderId]?.dataChannel) {
      console.error("Cannot request file: Peer not connected");
      return;
    }

    const dataChannel = this.peerConnectionMap[senderId].dataChannel;

    // Send file request to the specific peer
    dataChannel.send(JSON.stringify({
      type: 'file-request',
      data: {
        fileId: fileId,
        requesterId: this.unique_id
      }
    }));

    // Notify user that file is being requested
    this._chatMessages.next({
      senderId: 'system',
      senderName: 'System',
      message: `Requesting file... Please wait.`,
      timestamp: Date.now()
    })
  }

  async notifyEncryptionStatus(enabled: boolean): Promise<void> {
    // Only notify if we have active connections
    for (const peerId of Object.keys(this.peerConnectionMap)) {
      const connection = this.peerConnectionMap[peerId];
      if (connection.dataChannel && connection.dataChannel.readyState === 'open') {
        if (enabled) {
          // Send public key when enabling
          const publicKeyString = await this.encryption.exportPublicKey();
          if (publicKeyString) {
            connection.dataChannel.send(JSON.stringify({
              type: 'encryption-status',
              enabled: true,
              publicKey: publicKeyString
            }));
          }
          console.log(publicKeyString);
        } else {
          // Just notify when disabling
          connection.dataChannel.send(JSON.stringify({
            type: 'encryption-status',
            enabled: false
          }));
        }
      }
    }
  }

  private processFileChunk(fileId: string, chunkIndex: number, binaryData: ArrayBuffer, fromPeer: string = 'unknown'): void {
    console.log(this.fileTransfers)
    console.log(fileId)
    let fileTransfer = this.fileTransfers.get(fileId);

    if (!fileTransfer) {
      console.error("Received binary chunk without file metadata");
      return;
    }

    // Store the binary data directly
    fileTransfer.chunks[chunkIndex] = binaryData;
    fileTransfer.receivedChunks++;

    // Calculate and emit progress
    const totalChunks = fileTransfer.chunks.length;
    const progress = Math.round((fileTransfer.receivedChunks / totalChunks) * 100);

    // Log using the parameters passed to this method, not properties of binaryData
    console.log(`Received binary chunk ${chunkIndex + 1} of ${totalChunks} for file ${fileId}`);

    this.zone.run(() => {
      this._fileTransferProgress.next({
        fileId,
        fileName: fileTransfer.fileName,
        progress,
        type: 'download',
        peerId: fromPeer
      });
    });
    console.log(fileTransfer.receivedChunks, totalChunks);
    // If we've received all chunks, assemble the file
    if (fileTransfer.receivedChunks === totalChunks) {
      this.assembleFile(fileTransfer);
    }
  }

  private calculateHash(chunks: ArrayBuffer[]): string {
    // Create a new SHA-256 object
    const hashObj = new jsSHA("SHA-256", "ARRAYBUFFER");

    // Update the hash with each chunk
    for (const chunk of chunks) {
      hashObj.update(chunk);
    }

    // Get the final hash digest
    return hashObj.getHash("HEX");
  }
}
