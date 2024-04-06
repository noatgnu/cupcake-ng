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
  makingOffer = false;
  polite = false;
  ignoreOffer = false;
  stream?: MediaStream;
  unique_id?: string;
  peerConnectionMap: {[key: string]: RTCPeerConnection} = {};
  acceptCall = false;

  constructor(private accounts: AccountsService) {

  }

  connect(currentSessionID: string) {
    this.peerConnection = this.createPeerConnection();
    this.signallingConnection = this.createSignallingConnection(currentSessionID);
  }
  private createPeerConnection(connectionID: string|undefined = ""): RTCPeerConnection {
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
          candidate: event.candidate,
          to: connectionID
        });
      }
    }
    pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await pc.setLocalDescription();
        this.signallingConnection?.next({
          type: 'offer',
          description: pc.localDescription,
          to: connectionID
        });
      } catch (e) {
        console.error(e);
      } finally {
        this.makingOffer = false;
      }

    }
    pc.ontrack = ({track, streams}) => {
      track.onmute = () => {
        console.log('track muted')
      }
      track.onunmute = () => {
        console.log('track unmuted')
      }
    }
    console.log(pc.localDescription)

    return pc;
  }

  private createSignallingConnection(currentSessionID: string): WebSocketSubject<any> {
    const url = `${this.baseURL}/ws/webrtc_signal/${currentSessionID}/?token=${this.accounts.token}`.replace("http", "ws");
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
    ws.subscribe(async (data: any) => {
      console.log(data)
      if (data.message) {
        if (data.unique_id) {
          this.unique_id = data.unique_id;
        }
      } else {
        const {type, sdp, candidate, from} = data;
        if (this.acceptCall) {
          await this.handleSignallingData(type, sdp, candidate, from);
        }

      }

    })
    return ws;
  }

  async handleSignallingData(type: string, sdp: RTCSessionDescriptionInit | undefined, candidate: RTCIceCandidate | undefined, from: string | undefined) {
    let ignoreOffer = false;
    try {
      switch (type) {
        case 'offer':
          if (!this.peerConnectionMap[from!]) {
            this.peerConnectionMap[from!] = this.createPeerConnection();
          }

          const offerCollision = (this.makingOffer || this.peerConnection?.signalingState !== 'stable');
          ignoreOffer = !this.polite && offerCollision;
          if (ignoreOffer) {
            return;
          }
          await this.peerConnectionMap[from!].setRemoteDescription(sdp!);
          const answer = await this.peerConnectionMap[from!].createAnswer()
          await this.peerConnectionMap[from!].setLocalDescription(answer!);
          const data = {...answer, to:from}
          this.signallingConnection?.next(data);
          break;
        case 'answer':
          this.peerConnectionMap[from!].setRemoteDescription(sdp!);
          break;
        case 'candidate':
          try {
            await this.peerConnectionMap[from!].addIceCandidate(candidate!);
          } catch (e) {
            if (!ignoreOffer) {
              throw e;
            }
          }
          break;
      }
    } catch (e) {
      console.error(e);
    }

  }

  async start() {
    if (!this.stream) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
      } catch (e) {
        console.error(e);
      }
    }
  }

  async call() {
    this.acceptCall = true;
    await this.start();
    await this.peerConnection?.createOffer().then((offer) => {
      this.peerConnection?.setLocalDescription(offer);
      this.signallingConnection?.next(offer);
    });
  }

  async end() {
    this.acceptCall = false;
    this.stream?.getTracks().forEach((track) => {
      track.stop();
    });
    this.stream = undefined;
    this.peerConnection?.close();
    this.signallingConnection?.unsubscribe();
  }
}
