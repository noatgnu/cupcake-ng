import { Injectable } from '@angular/core';
import {WebSocketSubject} from "rxjs/internal/observable/dom/WebSocketSubject";
import {environment} from "../environments/environment";
import {AccountsService} from "./accounts/accounts.service";

@Injectable({
  providedIn: 'root'
})
export class WebrtcService {
  private peerConnection?: RTCPeerConnection;
  private signallingConnection?: WebSocketSubject<any>;
  baseURL = environment.baseURL

  constructor(private accounts: AccountsService) {

  }

  connect() {
    this.peerConnection = this.createPeerConnection();
    this.signallingConnection = this.createSignallingConnection();
  }
  private createPeerConnection(): RTCPeerConnection {
    const configuration: RTCConfiguration = {
      iceServers: [
        {
          urls:[ 'turn:51.89.194.112:3478', 'stun:51.89.194.112:3478'],
          username: 'testuser',
          credential: 'testuser21021992'
        }
      ]
    };
    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signallingConnection?.next({
          type: 'candidate',
          candidate: event.candidate
        });
      }
    }
    pc.onnegotiationneeded = () => {
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        this.signallingConnection?.next({
          type: 'offer',
          sdp: offer
        });
      });
    }
    console.log(pc.localDescription)

    return pc;
  }

  private createSignallingConnection(): WebSocketSubject<any> {
    const url = `${this.baseURL}/ws/webrtc_signal/?token=${this.accounts.token}`.replace("http", "ws");
    const ws = new WebSocketSubject({
      url: url,
      openObserver: {
        next: () => {
          console.log("Connected to signalling websocket")
        }
      },
      closeObserver: {
        next: () => {
          console.log("Closed connection to signalling websocket")
        }
      }
    });
    ws.subscribe((data: any) => {
      const {type, sdp, candidate} = data;
      console.log(data)
      this.handleSignallingData(type, sdp, candidate);
    })
    return ws;
  }

  handleSignallingData(type: string, sdp: RTCSessionDescriptionInit | undefined, candidate: RTCIceCandidate | undefined) {
    switch (type) {
      case 'offer':
        this.peerConnection?.setRemoteDescription(sdp!);
        this.peerConnection?.createAnswer().then((answer) => {
          this.peerConnection?.setLocalDescription(answer);
          this.signallingConnection?.next({
            type: 'answer',
            sdp: answer
          });
        });
        break;
      case 'answer':
        this.peerConnection?.setRemoteDescription(sdp!);
        break;
      case 'candidate':
        this.peerConnection?.addIceCandidate(candidate!);
        break;
    }
  }

  async start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
      stream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, stream);
        console.log(this.peerConnection)
      });
    } catch (e) {
      console.error(e);
    }
  }

  async call() {
    await this.start();
    await this.peerConnection?.createOffer().then((offer) => {
      this.peerConnection?.setLocalDescription(offer);
      this.signallingConnection?.next({
        type: 'offer',
        sdp: offer
      });
    });
  }
}
