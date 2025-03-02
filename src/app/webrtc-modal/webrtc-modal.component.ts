import { Component } from '@angular/core';
import {WebrtcService} from "../webrtc.service";
import {FormsModule} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-webrtc-modal',
    imports: [
        FormsModule
    ],
    templateUrl: './webrtc-modal.component.html',
    styleUrl: './webrtc-modal.component.scss'
})
export class WebrtcModalComponent {
  connectionType: 'host'|'viewer' = 'viewer'



  constructor(public webrtc: WebrtcService, private activeModal: NgbActiveModal) {
    this.connectionType = this.webrtc.connectionType
    this.getAllInputDevices().then()


  }

  async connect() {
    await this.webrtc.call(this.connectionType)
  }

  async getAllInputDevices() {
    this.webrtc.cameraDevices = await navigator.mediaDevices.enumerateDevices().then((devices) => {
      return devices.filter((device) => device.kind === 'videoinput');
    })
    this.webrtc.audioDevices = await navigator.mediaDevices.enumerateDevices().then((devices) => {
      return devices.filter((device) => device.kind === 'audioinput');
    })

  }

  async changeInputDevice() {

  }

  close() {
    this.webrtc.end().then(() => {
      this.activeModal.dismiss()
    })
  }
}
