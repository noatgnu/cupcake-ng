import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {NgbActiveModal, NgbProgressbar} from "@ng-bootstrap/ng-bootstrap";
import jsSHA from "jssha";
import {WebService} from "../web.service";
import {ToastService} from "../toast.service";
import {Annotation} from "../annotation";

@Component({
    selector: 'app-upload-large-file-modal',
    imports: [
        NgbProgressbar
    ],
    templateUrl: './upload-large-file-modal.component.html',
    styleUrl: './upload-large-file-modal.component.scss'
})
export class UploadLargeFileModalComponent {
  uploadMultiple: boolean = true;
  @ViewChild('uploadFileInput') uploadFileInput: ElementRef | undefined;
  @Input() session_id: string = "";
  @Input() folder_id: number = 0;
  @Input() step_id: number = 0;
  @Input() instrument_job_id: number = 0;
  @Input() instrument_user_type: "user_annotation" | "staff_annotation" | null = null;
  private _metadata_import: string = "";
  @Input() set metadata_import(data_type: string) {
    this._metadata_import = data_type;
    if (data_type === "user_metadata"|| data_type === "staff_metadata") {
      this.uploadMultiple = false;
    }
  }

  get metadata_import(): string {
    return this._metadata_import;
  }
  fileProgressMap: {[key: string]: {progress: number, total: number}} = {};
  fileList: File[] = [];

  fileName: string = "";
  constructor(private activeModal: NgbActiveModal, private web: WebService, private toastService: ToastService) { }

  close() {
    this.activeModal.dismiss()
  }

  async uploadData(event: Event){
    const files = (event.target as HTMLInputElement).files
    if (files) {
      this.fileList = []
      for (let i = 0; i < files.length; i++) {
        this.fileList.push(files[i])
        this.fileProgressMap[files[i].name] = {progress: 0, total: files[i].size}
      }
      for (let i = 0; i < files.length; i++) {
        await this.uploadFile(files[i]);
      }
    }
  }

  private async uploadFile(file: File) {
    const chunkSize = 1024 * 1024;
    const fileSize = file.size;
    const hashObj = new jsSHA("SHA-256", "ARRAYBUFFER");
    if (chunkSize > fileSize) {
      const chunk = await file.arrayBuffer();
      hashObj.update(chunk)
      const hashDigest = hashObj.getHash("HEX");
      const result = await this.web.uploadDataChunkComplete("", hashDigest, file, file.name).toPromise()
      this.fileProgressMap[file.name].progress = fileSize;
      if (result?.completed_at) {
        this.toastService.show(file.name, "Upload completed")
        this.toastService.show(file.name, "Binding file...")
        if (this.instrument_job_id && this.instrument_user_type) {
          this.web.bindUploadedFile(null, result?.id, file.name, file.name, this.step_id, this.folder_id, this.instrument_job_id, this.instrument_user_type).subscribe((data) => {
            this.toastService.show(file.name, "Binding completed")
            if (this.metadata_import === "user_metadata" || this.metadata_import === "staff_metadata") {
              this.importMetadata(data)
            }
          })
        } else {
          this.web.bindUploadedFile(this.session_id, result?.id, file.name, file.name, this.step_id, this.folder_id).subscribe((data) => {
            this.toastService.show(file.name, "Binding completed")
          })
        }
      }
    } else {
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
        const contentRange = `bytes ${currentOffset}-${end - 1}/${fileSize}`;
        console.log(contentRange)
        const result = await this.web.uploadDataChunk(currentURL, filePart, file.name, contentRange).toPromise()
        if (result) {
          currentURL = result.url;
          currentOffset = result.offset;
          this.fileProgressMap[file.name].progress = currentOffset;
        }
      }
      if (currentURL !== "") {
        const hashDigest = hashObj.getHash("HEX");
        const result = await this.web.uploadDataChunkComplete(currentURL, hashDigest).toPromise()
        if (result?.completed_at) {
          this.toastService.show(file.name, "Upload completed")
          this.toastService.show(file.name, "Binding file...")
          if (this.instrument_job_id && this.instrument_user_type) {
            this.web.bindUploadedFile(null, result?.id, file.name, file.name, this.step_id, this.folder_id, this.instrument_job_id, this.instrument_user_type).subscribe((data) => {
              this.toastService.show(file.name, "Binding completed")
              if (this.metadata_import === "user_metadata" || this.metadata_import === "staff_metadata") {
                this.importMetadata(data)
              }
            })
          } else {
            this.web.bindUploadedFile(this.session_id, result?.id, file.name, file.name, this.step_id, this.folder_id).subscribe((data) => {
              this.toastService.show(file.name, "Binding completed")
            })
          }

        }
      }
    }
  }

  importMetadata(annotation: Annotation) {
    this.web.instrumentJobImportSDRFMetadata(this.instrument_job_id, annotation.id, this.web.cupcakeInstanceID, this.metadata_import).subscribe((data) => {
      this.toastService.show("Metadata", "Importing metadata")
      this.activeModal.close()
    })
  }
}
