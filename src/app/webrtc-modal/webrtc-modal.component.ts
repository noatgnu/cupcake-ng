import { Component } from '@angular/core';
import {WebrtcService} from "../webrtc.service";

@Component({
  selector: 'app-webrtc-modal',
  standalone: true,
  imports: [],
  templateUrl: './webrtc-modal.component.html',
  styleUrl: './webrtc-modal.component.scss'
})
export class WebrtcModalComponent {

  constructor(public webrtc: WebrtcService) {

  }

  async connect() {
    await this.webrtc.call()
  }
}
