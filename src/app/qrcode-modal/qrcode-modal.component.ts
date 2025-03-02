import {AfterViewInit, Component, Input} from '@angular/core';
import QRCodeStyling from "qr-code-styling";
import {Options} from "qr-code-styling";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-qrcode-modal',
  standalone: true,
  imports: [
  ],
  templateUrl: './qrcode-modal.component.html',
  styleUrl: './qrcode-modal.component.scss'
})
export class QrcodeModalComponent implements AfterViewInit{
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
  qrCode?: QRCodeStyling

  constructor(private modal: NgbActiveModal) {
  }

  ngAfterViewInit() {
    const qrCode = new QRCodeStyling(this.config);
    const canvas = document.getElementById("canvas")
    if (canvas) {
      qrCode.append(canvas)
    }
    this.qrCode = qrCode
  }

  close() {
    this.modal.dismiss()
  }

  download() {
    if (this.qrCode) {
      this.qrCode.download({
        name: "qrcode",
        extension: "svg"
      }).then(() => {

      })
    }
  }
}
