import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {WebsocketService} from "../websocket.service";

@Component({
  selector: 'app-websocket-status-modal',
  imports: [],
  templateUrl: './websocket-status-modal.component.html',
  styleUrl: './websocket-status-modal.component.scss'
})
export class WebsocketStatusModalComponent {
  constructor(private modal: NgbActiveModal, public ws: WebsocketService) { }
  close() {
    this.modal.dismiss();
  }
}
