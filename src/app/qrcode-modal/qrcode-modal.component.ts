import {Component, Input} from '@angular/core';
import {NgxQrcodeStylingModule, Options} from "ngx-qrcode-styling"
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-qrcode-modal',
  standalone: true,
  imports: [
    NgxQrcodeStylingModule
  ],
  templateUrl: './qrcode-modal.component.html',
  styleUrl: './qrcode-modal.component.scss'
})
export class QrcodeModalComponent {
  private _url: string = ""

  @Input() set url(value: string) {
    this.config.data = value
    this._url = value
  }

  get url() {
    return this._url
  }

  config: Options = {
    width: 250,
    height: 250,
    data: this.url,
    //image: "assets/favicon.128x128.png",
    margin: 5,
    dotsOptions: {
      color: "#2E2D62",
      type: "dots",
    },
    backgroundOptions: {
      color: "#ffffff",
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 0
    }
    //image: "assets/favicon.png",
  }

  constructor(private modal: NgbActiveModal) {
  }

  close() {
    this.modal.dismiss()
  }
}
