import { Component } from '@angular/core';
import {WebService} from "../../web.service";
import {ToastService} from "../../toast.service";
import {NgbProgressbar} from "@ng-bootstrap/ng-bootstrap";
import jsSHA from "jssha";

@Component({
  selector: 'app-user-data',
  standalone: true,
  imports: [
    NgbProgressbar
  ],
  templateUrl: './user-data.component.html',
  styleUrl: './user-data.component.scss'
})
export class UserDataComponent {
  chunkUploadProgress = 0;
  chunkUploadTotal = 0;

  constructor(private web: WebService, private toastService: ToastService) {
  }

  exportUserData() {
    this.web.exportUserData().subscribe((data: any) => {
      this.toastService.show("User Data", "Processing export user data request...")
    })
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
          }
        }
      }
    }
  }
}
