import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {environment} from "../../environments/environment";
import {ToastService} from "../toast.service";
import {WebsocketService} from "../websocket.service";
import {WebService} from "../web.service";

@Component({
  selector: 'app-download-modal',
  standalone: true,
  imports: [],
  templateUrl: './download-modal.component.html',
  styleUrl: './download-modal.component.scss'
})
export class DownloadModalComponent {

  constructor(private activeModal: NgbActiveModal, private ws: WebsocketService, private toastService: ToastService, private web: WebService) {
    this.ws.userWSConnection?.subscribe((data) => {
      if (data) {
        console.log(data)

        if(data.signed_value && data.user_download && data.instance_id === this.web.cupcakeInstanceID) {
          this.toastService.show("Export File", "Downloading file...")
          const downloadURL = environment.baseURL + "/api/protocol/download_temp_file/?token=" + data.signed_value
          const link = document.createElement('a');
          link.href = downloadURL;
          link.download = data.signed_value.split(":")[0]
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          this.activeModal.close()
          //window.open(environment.baseURL + "/api/protocol/download_temp_file/?token=" + data.signed_value, "_blank")
        }
      }
    })
  }

  close() {
    this.activeModal.dismiss()
  }
}
