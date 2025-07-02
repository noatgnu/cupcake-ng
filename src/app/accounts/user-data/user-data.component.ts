import { Component, OnDestroy } from '@angular/core';
import {WebService} from "../../web.service";
import {ToastService} from "../../toast.service";
import {NgbProgressbar} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";
import jsSHA from "jssha";
import {environment} from "../../../environments/environment";
import {WebsocketService} from "../../websocket.service";
import { Subscription } from 'rxjs';
import {DecimalPipe} from "@angular/common";

@Component({
    selector: 'app-user-data',
    imports: [
        NgbProgressbar,
        FormsModule,
      DecimalPipe
    ],
    templateUrl: './user-data.component.html',
    styleUrl: './user-data.component.scss'
})
export class UserDataComponent implements OnDestroy {
  chunkUploadProgress = 0;
  chunkUploadTotal = 0;
  selectedFormat: 'zip' | 'tar.gz' = 'zip';
  webSubscription?: Subscription;
  progress = 0;
  exportInProgress = false;
  downloadReady = false;
  downloadUrl = '';
  fileName = '';
  
  // Import options
  importOptions = {
    protocols: true,
    sessions: true,
    annotations: true,
    projects: true,
    reagents: true,
    instruments: true,
    lab_groups: true,
    messaging: true,
    support_models: true
  };

  constructor(private web: WebService, private toastService: ToastService, private ws: WebsocketService) {
    this.webSubscription = this.ws.userWSConnection?.subscribe((data) => {
      if (data) {
        // Handle progress updates
        if ("export_type" in data && "instance_id" in data && "progress" in data) {
          if (data["progress"] > this.progress) {
            this.progress = data["progress"];
            this.exportInProgress = this.progress < 100;
          }
        }

        // Handle download ready (separate check, not in else)
        if ("signed_value" in data && "instance_id" in data) {
          if (data["instance_id"] === this.web.cupcakeInstanceID) {
            console.log("Received data from websocket:", data);
            if (data["signed_value"].startsWith("cupcake_export")) {
              this.toastService.show("Export File", "Download ready for user data file");
              this.exportInProgress = false;
              this.downloadReady = true;
              this.downloadUrl = environment.baseURL + "/api/protocol/download_temp_file/?token=" + data["signed_value"];
              this.fileName = data["signed_value"].split(":")[0];
              this.toastService.show("Export File", "Export completed! Ready for download.");
            }
          }
        }
      }
    })
  }

  exportUserData() {
    this.progress = 0;
    this.exportInProgress = true;
    this.downloadReady = false;
    this.downloadUrl = '';
    this.fileName = '';
    this.web.exportUserData({ format: this.selectedFormat }).subscribe((data: any) => {
      this.toastService.show("User Data", `Processing export user data request (${this.selectedFormat})...`)
    })
  }

  downloadFile() {
    if (this.downloadReady && this.downloadUrl) {
      this.toastService.show("Export File", "Downloading file...")
      const link = document.createElement('a');
      link.href = this.downloadUrl;
      link.download = this.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  selectAllImportOptions() {
    Object.keys(this.importOptions).forEach(key => {
      (this.importOptions as any)[key] = true;
    });
  }

  deselectAllImportOptions() {
    Object.keys(this.importOptions).forEach(key => {
      (this.importOptions as any)[key] = false;
    });
  }

  async importUserData(event: Event){
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const chunkSize = 1024 * 1024;
      const fileSize = file.size;
      this.chunkUploadTotal = fileSize
      const hashObj = new jsSHA("SHA-256", "ARRAYBUFFER");
      if (chunkSize > fileSize) {
        console.log("Uploading single chunk")
        const chunk = await file.arrayBuffer();
        hashObj.update(chunk)
        const hashDigest = hashObj.getHash("HEX");
        const result = await this.web.uploadDataChunkComplete("", hashDigest, file, file.name).toPromise()
        this.chunkUploadProgress = fileSize;
        if (result?.completed_at) {
          this.toastService.show("User Data", "Upload complete")
          this.toastService.show("User Data", "Importing user data...")
          this.web.importUserData(result.id, this.importOptions).subscribe((data) => {
            this.toastService.show("User Data", "Import complete")
          })
        }
      } else {
        console.log("Uploading multiple chunks")
        let currentURL = "";
        let currentOffset = 0;
        while (fileSize > currentOffset) {
          let end = currentOffset + chunkSize;
          if (end >= fileSize) {
            end = fileSize;
          }
          const chunk = await file.slice(currentOffset, end).arrayBuffer();
          hashObj.update(chunk)
          const filePart = new File([chunk], file.name, {type: file.type})
          console.log(filePart.size)
          const contentRange = `bytes ${currentOffset}-${end-1}/${fileSize}`;
          console.log(contentRange)
          const result = await this.web.uploadDataChunk(currentURL, filePart,file.name, contentRange).toPromise()
          if (result) {
            currentURL = result.url;
            currentOffset = result.offset;
            this.chunkUploadProgress = currentOffset;
          }
        }
        if (currentURL !== "") {
          const hashDigest = hashObj.getHash("HEX");
          const result = await this.web.uploadDataChunkComplete(currentURL, hashDigest).toPromise()
          if (result?.completed_at) {
            this.toastService.show("User Data", "Upload complete")
            this.toastService.show("User Data", "Importing user data...")
            this.web.importUserData(result.id, this.importOptions).subscribe((data) => {
              this.toastService.show("User Data", "Import complete")
            })
          }
        }
      }
    }
  }

  ngOnDestroy() {
    if (this.webSubscription) {
      this.webSubscription.unsubscribe();
    }
  }
}
