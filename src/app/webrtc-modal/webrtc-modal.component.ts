import { Component } from '@angular/core';
import {WebrtcService} from "../webrtc.service";
import {FormsModule} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-webrtc-modal',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './webrtc-modal.component.html',
  styleUrl: './webrtc-modal.component.scss'
})
export class WebrtcModalComponent {
  connectionType: 'host'|'viewer' = 'viewer'

  constructor(public webrtc: WebrtcService, private activeModal: NgbActiveModal) {

  }

  async connect() {
    await this.webrtc.call(this.connectionType)
  }

  close() {
    this.webrtc.end().then(() => {
      this.activeModal.dismiss()
    })
  }
}
