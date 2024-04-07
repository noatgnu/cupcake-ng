import {Component, ElementRef, Input, ViewChild} from '@angular/core';

@Component({
  selector: 'app-webrtc-video',
  standalone: true,
  imports: [],
  templateUrl: './webrtc-video.component.html',
  styleUrl: './webrtc-video.component.scss'
})
export class WebrtcVideoComponent {
  @ViewChild('webRTCVideoViewer') webRTCVideoViewer?: ElementRef;

  @Input() set peerConnection(value: RTCPeerConnection) {

  }



}
