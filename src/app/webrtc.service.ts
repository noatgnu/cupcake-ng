import {ElementRef, Injectable} from '@angular/core';
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
  polite = true;
  ignoreOffer = false;
  stream?: MediaStream;
  unique_id?: string;
  peerConnectionMap: {[key: string]: RTCPeerConnection} = {};
  peerList: string[] = [];
  acceptCall = false;
  connected = false;
  constraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
    audio: true,
  };
  constructor(private accounts: AccountsService) {

  }

  connect(currentSessionID: string) {

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

    console.log(connectionID)

    const pc = new RTCPeerConnection(configuration);
    if (this.stream) {
      this.stream.getTracks().forEach(track => pc.addTrack(track, this.stream!));
    }
    console.log(pc.localDescription)

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

      } catch (e) {
        console.log(e);
      } finally {

      }
      console.log('negotiation needed')
      this.makingOffer = true;
      console.log(this.makingOffer)
      await pc.setLocalDescription();
      console.log(pc.localDescription)
      console.log(connectionID)
      this.signallingConnection?.next( pc.localDescription);
      this.makingOffer = false;

    }
    pc.ontrack = ({track, streams}) => {
      console.log(track)
      console.log(streams)
      track.onmute = () => {
        console.log('track muted')
        //const videoElement = document.getElementById(`webrtc-${connectionID}`) as HTMLVideoElement;
        //if (videoElement) {
        //  videoElement.srcObject = null;
        //}

      }
      console.log(connectionID)
      track.onunmute = () => {
        console.log(connectionID)
        console.log(`webrtc-${connectionID}`)
        let v = document.getElementById(`webrtc-${connectionID}`) as HTMLVideoElement;
        console.log(v)
        if (v) {
          v.srcObject = streams[0];
          v.oncanplaythrough = () => {
            v.play();
          }
        } else {
          let observer = new MutationObserver(mutations => {
            mutations.forEach(function (mutation) {
              let nodes = Array.from(mutation.addedNodes)
              for (const node of nodes) {
                if (node.contains(document.getElementById(`webrtc-${connectionID}`))) {
                  v = document.getElementById(`webrtc-${connectionID}`) as HTMLVideoElement;
                  if (v) {
                    v.srcObject = streams[0];
                    v.oncanplaythrough = () => {
                      v.play();
                    }
                  }
                  observer.disconnect()
                  break
                }
              }
            })
          })
        }
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
      //console.log(data)
      if (data.message) {
        if (data.unique_id) {
          this.unique_id = data.unique_id;
        }
      } else {
        const {type, sdp, candidate, from} = data;
        if (this.acceptCall && from) {
          console.log(data)
          await this.handleSignallingData(type, sdp, candidate, from);
        }

      }

    })
    return ws;
  }

  async handleSignallingData(type: string, sdp: RTCSessionDescriptionInit | undefined, candidate: RTCIceCandidate | undefined, from: string | undefined) {
    let ignoreOffer = false;
    console.log(from)
    if (!this.peerConnectionMap[from!]) {
      console.log(from)
      this.peerConnectionMap[from!] = this.createPeerConnection(from!);
    }
    if (!this.peerList.includes(from!)) {
      this.peerList.push(from!);
    }
    try {

    } catch (e) {
      console.error(e);
    }
    switch (type) {
      case 'offer':
        console.log(this.peerConnectionMap[from!])
        console.log(this.polite)
        console.log(this.makingOffer)
        const offerCollision = (this.makingOffer || this.peerConnectionMap[from!].signalingState !== 'stable');
        console.log(offerCollision)
        ignoreOffer = !this.polite && offerCollision;
        if (ignoreOffer) {
          return;
        }
        console.log(this.peerConnectionMap[from!].localDescription)
        console.log(this.peerConnectionMap[from!].remoteDescription)
        console.log(sdp)
        await this.peerConnectionMap[from!].setRemoteDescription(sdp!);
        const answer = await this.peerConnectionMap[from!].createAnswer()
        await this.peerConnectionMap[from!].setLocalDescription();
        console.log(answer)
        const data = {sdp:answer.sdp, type: answer.type, to:from}
        this.signallingConnection?.next(data);
        console.log(this.peerConnectionMap[from!])
        break;
      case 'answer':
        console.log(this.peerConnectionMap[from!])
        await this.peerConnectionMap[from!].setLocalDescription()
        await this.peerConnectionMap[from!].setRemoteDescription(sdp!);
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
  }

  async start() {
    if (!this.stream) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);
        const currentVideoElement = document.getElementById('webrtc-local') as HTMLVideoElement;
        if (currentVideoElement) {
          currentVideoElement.srcObject = this.stream;
          currentVideoElement.oncanplaythrough = () => {
            currentVideoElement.muted = true;
            currentVideoElement.play();
          }

        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  async call() {
    this.acceptCall = true;
    await this.start();
    this.peerConnection = this.createPeerConnection();
    //await this.peerConnection?.createOffer().then((offer) => {
    //  console.log(offer)
    //  this.peerConnection?.setLocalDescription(offer);
    //  this.signallingConnection?.next(offer);
   //});
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

  getStreamFromPeer(peerID: string) {
    // retrieve video stream from peer to be displayed


  }
}
