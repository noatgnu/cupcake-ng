import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {WebrtcService} from "../../webrtc.service";

@Component({
    selector: 'app-webrtc-video',
    imports: [],
    templateUrl: './webrtc-video.component.html',
    styleUrl: './webrtc-video.component.scss'
})
export class WebrtcVideoComponent implements AfterViewInit{
  @ViewChild('webRTCVideoViewer') webRTCVideoViewer?: ElementRef;

  @Input() set peerConnection(value: RTCPeerConnection) {

  }

  constructor(private webrtc: WebrtcService) {

  }

  ngAfterViewInit() {
    /*if (this.webrtc.stream) {
      const currentVideoElement = document.getElementById('webrtc-local') as HTMLVideoElement;
      if (currentVideoElement) {
        currentVideoElement.srcObject = this.webrtc.stream;
        currentVideoElement.oncanplaythrough = () => {
          currentVideoElement.muted = true;
          currentVideoElement.play();
        }
        console.log(this.webrtc.stream)
      }
    }*/
  }

}
