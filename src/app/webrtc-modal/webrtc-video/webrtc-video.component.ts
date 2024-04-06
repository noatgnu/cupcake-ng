import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-webrtc-video',
  standalone: true,
  imports: [],
  templateUrl: './webrtc-video.component.html',
  styleUrl: './webrtc-video.component.scss'
})
export class WebrtcVideoComponent {
  _peerConnection?: RTCPeerConnection


  @Input() set peerConnection(value: RTCPeerConnection) {

  }



}
