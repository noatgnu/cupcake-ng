import {Injectable} from '@angular/core';
import {WebSocketSubject} from "rxjs/internal/observable/dom/WebSocketSubject";
import {environment} from "../environments/environment";
import {AccountsService} from "./accounts/accounts.service";
import {WebService} from "./web.service";

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
  searchingForPeers = false;
  peerConnectionMap: {[key: string]: {
    pc: RTCPeerConnection,
    offered: boolean,
    answered: boolean,
    connectionType: 'viewer'|'host',
    connected: boolean,
      dataChannel?: RTCDataChannel
  }
  } = {};
  peerList: string[] = [];
  acceptCall = false;
  connected = false;
  constraints: any = {
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
  constructor(private accounts: AccountsService, private web: WebService) {

  }

  connect(currentSessionID: string) {
    this.signallingConnection = this.createSignallingConnection(currentSessionID);
  }
  private async createPeerConnection(connectionID: string|undefined = "", autonegotiate: boolean = true): Promise<RTCPeerConnection> {
    console.log("Creating peer connection for", connectionID)
    const credential = await this.web.getCoturnCredentials().toPromise();
    const configuration: RTCConfiguration = {
      iceServers: [
        {
          urls:[
            //`turn:${credential?.turn_server}:${credential?.turn_port}`,
            //'stun:188.68.54.37:3478'
            `turn:188.68.54.37:3478`
          ],
          //username: credential?.username,
          //credential: credential?.password
          username: 'testuser',
          credential: 'testuser'
        },
        {
          urls: ['stun:stun.l.google.com:19302']
        }
      ],
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'relay',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',

    };


    console.log(connectionID)

    const pc = new RTCPeerConnection(configuration);
    const dataChannel = pc.createDataChannel('dataChannel');
    dataChannel.onopen = () => {
      console.log('data channel opened')
      this.peerConnectionMap[connectionID!].dataChannel?.send('Connection established.');
    }
    dataChannel.onmessage = (event) => {
      console.log('data channel message')
      console.log(event)
    }
    dataChannel.onclose = () => {
      console.log('data channel closed')
    }
    if (this.connectionType==='viewer') {
      //this.stream.getTracks().forEach(track => pc.addTrack(track, this.stream!));
    //} else {
      console.log("Viewer only. Activate receive only mode.")
      pc.addTransceiver('video', {direction: 'recvonly'});
      pc.addTransceiver('audio', {direction: 'recvonly'});
    } else {
      if (this.connectionType === 'host') {
        this.stream?.getTracks().forEach((track) => {
          pc.addTrack(track, this.stream!);
        })
      }
    }


    pc.onicecandidate = (event) => {
      if (event.candidate && connectionID !== "" && connectionID !== undefined) {
        this.signallingConnection?.next({
          type: 'candidate',
          candidate: event.candidate,
          to: connectionID,
          id_type: this.connectionType
        });
      }
    }
    pc.onnegotiationneeded = async () => {
      console.log('negotiation needed')
      if (!autonegotiate) {
        return
      }
      this.makingOffer = true;
      await pc.setLocalDescription(await pc.createOffer());

      this.signallingConnection?.next({type: pc.localDescription?.type, sdp: pc.localDescription?.sdp, to: connectionID, id_type: this.connectionType});
      this.makingOffer = false;

    }
    pc.onicecandidateerror = (event) => {

    }
    pc.oniceconnectionstatechange = (event) => {

    }
    pc.onicegatheringstatechange = (event) => {

    }
    pc.onconnectionstatechange = (event) => {
      console.log(Date.now(), pc.connectionState, "connection state")
      if (pc.connectionState === 'connected') {
        this.connected = true;
        this.peerConnectionMap[connectionID!].connected = true;
        this.peerConnectionMap[connectionID!].dataChannel = dataChannel;

      } else {
        this.peerConnectionMap[connectionID!].connected = false;
      }
    }
    pc.ondatachannel = (event) => {
      event.channel.send('Hello World!')
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
        let v = document.getElementById(`webrtc-${connectionID}`) as HTMLVideoElement;
        console.log(v)
        console.log(`webrtc-${connectionID}`)
        console.log(this.peerConnectionMap)
        if (v) {
          console.log(streams)
          v.srcObject = streams[0];
          v.oncanplaythrough = () => {
            v.muted = true
            v.play();

          }
        } else {
          let observer = new MutationObserver(mutations => {
            mutations.forEach(function (mutation) {
              let nodes = Array.from(mutation.addedNodes)
              for (const node of nodes) {
                if (node.contains(document.getElementById(`webrtc-${connectionID}`))) {
                  v = document.getElementById(`webrtc-${connectionID}`) as HTMLVideoElement;
                  console.log(v)
                  if (v) {
                    v.srcObject = streams[0];
                    v.oncanplaythrough = () => {
                      v.muted = true
                      v.play();
                    }
                  }
                  observer.disconnect()
                  break
                }
              }
            })
          })
          observer.observe(document.documentElement, {
            childList: true,
            subtree: true
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
        const {type, sdp, candidate, from, id_type} = data;
        if (this.acceptCall && from) {
          console.log(data)
          await this.handleSignallingData(type, sdp, candidate, from, id_type);
        }
      }
    })
    return ws;
  }

  async handleSignallingData(type: string, sdp: RTCSessionDescriptionInit | undefined, candidate: RTCIceCandidate | undefined, from: string | undefined, id_type: string | undefined) {
    if (!this.acceptCall) {
      return
    }
    if (!this.peerConnectionMap[from!]) {
      if (type === 'check') {
        if (this.peerConnectionMap[from!]) {
          // reset the connection
          this.peerConnectionMap[from!].pc.close();
          delete this.peerConnectionMap[from!];
        }
        this.peerConnectionMap[from!] = {
          pc: await this.createPeerConnection(from),
          offered: false,
          answered: false,
          connectionType: id_type === 'host' ? 'viewer' : 'host',
          connected: false
        }
      } else {
        this.peerConnectionMap[from!] = {
          pc: await this.createPeerConnection(from),
          offered: false,
          answered: false,
          connectionType: id_type === 'host' ? 'viewer' : 'host',
          connected: false
        }
      }
    }
    if (!this.peerList.includes(from!)) {
      this.peerList.push(from!);
    }
    if (id_type) {
      // @ts-ignore
      this.peerConnectionMap[from!].connectionType = id_type
    }
    console.log(this.peerConnectionMap)
    console.log(this.peerConnectionMap[from!].pc.signalingState)

    switch (type) {
      //case 'check':
      //  this.signallingConnection?.next({type: 'available', to: from, id_type: this.connectionType});
      //  break;
      case 'offer':
        if (sdp) {
          if (this.peerConnectionMap[from!].pc.signalingState !== 'stable') {
            if (!this.polite) {
              return
            }
            await Promise.all([
              this.peerConnectionMap[from!].pc.setLocalDescription({type: 'rollback'}),
              this.peerConnectionMap[from!].pc.setRemoteDescription(sdp!)
            ])
          }
        }
        const answer = await this.peerConnectionMap[from!].pc.createAnswer();
        await this.peerConnectionMap[from!].pc.setLocalDescription(answer);

        // Send the answer to the remote peer
        this.signallingConnection?.next({
          type: answer.type,
          sdp: answer.sdp,
          to: from,
          id_type: this.connectionType
        });
        break;
      case 'answer':
        // Set the remote description
        await this.peerConnectionMap[from!].pc.setRemoteDescription(sdp!);
        break;
      case 'candidate':
        await this.peerConnectionMap[from!].pc.addIceCandidate(candidate!);
        break;
    }


  }

  async start() {
    try {
      if (this.enableAudio || this.enableVideo) {
        this.constraints = {
          video: this.enableVideo ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          } : false,
          audio: this.enableAudio ? true : false,
        }
      } else {
        this.constraints = {
          video: false,
          audio: false
        }
      }
      if (this.constraints.video || this.constraints.audio) {
        this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);
        const currentVideoElement = document.getElementById('webrtc-local') as HTMLVideoElement;
        if (currentVideoElement) {
          currentVideoElement.srcObject = this.stream;
          currentVideoElement.oncanplaythrough = () => {
            currentVideoElement.muted = true;
            currentVideoElement.play();
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async call(connectionType: 'viewer'|'host') {
    this.acceptCall = true;
    this.connected = false;
    this.connectionType = connectionType;
    if (this.connectionType === 'host') {
      await this.start();
    }
    this.searchingForPeers = true;
    this.signallingConnection?.next({type: 'check', to: "", id_type: this.connectionType});
    //this.peerConnection = this.createPeerConnection("", false);

    //await this.peerConnection.setLocalDescription(await this.peerConnection.createOffer());

    //this.signallingConnection?.next({type: this.peerConnection.localDescription?.type, sdp: this.peerConnection.localDescription?.sdp, to: "", id_type: this.connectionType});

    //await this.peerConnection?.createOffer().then((offer) => {
    //  console.log(offer)
    //  this.peerConnection?.setLocalDescription(offer);
    //  this.signallingConnection?.next(offer);
   //});
    // check webrtc connection from peerConnectionMap every 5 seconds
    setInterval(() => {
      for (const peer in this.peerConnectionMap) {
        if (this.peerConnectionMap[peer].pc.iceConnectionState === 'disconnected') {
          this.peerConnectionMap[peer].pc.close();
          delete this.peerConnectionMap[peer];
          this.peerList = this.peerList.filter((p) => p !== peer);
        } else {
          // print out all stats
          //console.log(this.peerConnectionMap[peer].iceGatheringState)
          //console.log(this.peerConnectionMap[peer].iceConnectionState)
          //this.peerConnectionMap[peer].getStats().then((stats) => {
          //  stats.forEach((report) => {
          //   console.log(report);
          //  })
          //})
        }
      }
    }, 5000)
  }

  async end() {
    this.acceptCall = false;
    this.connected = false;
    this.searchingForPeers = false;
    this.stream?.getTracks().forEach((track) => {
      track.stop();
    });
    this.stream = undefined;
    this.peerConnection?.close();
    this.signallingConnection?.unsubscribe();
  }

  removeAllTracksFromAllPeers() {
    for (const peer in this.peerConnectionMap) {
      this.peerConnectionMap[peer].pc.getSenders().forEach((sender) => {
        this.peerConnectionMap[peer].pc.removeTrack(sender);
      })
    }
  }

  addAllTracksToAllPeers() {
    for (const peer in this.peerConnectionMap) {
      this.stream?.getTracks().forEach((track) => {
        this.peerConnectionMap[peer].pc.addTrack(track, this.stream!);
      })
    }
  }

  reNegotiateAllPeers() {
    //this.removeAllTracksFromAllPeers();
    this.removeAllTracksFromAllPeers();
/*    for (const peer in this.peerConnectionMap) {
      this.peerConnectionMap[peer].pc.createOffer().then((offer) => {
        const data = {sdp:offer.sdp, type: offer.type, to:peer, id_type: this.connectionType}
        this.peerConnectionMap[peer].pc.setLocalDescription(offer);
        this.signallingConnection?.next(data);
      })
    }*/
  }

}
