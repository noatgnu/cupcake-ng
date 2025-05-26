import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {NgbActiveModal, NgbModal, NgbProgressbar} from "@ng-bootstrap/ng-bootstrap";
import jsSHA from "jssha";
import {WebService, ChunkUploadResponse} from "../web.service";
import {ToastService} from "../toast.service";
import {Annotation} from "../annotation";
import {firstValueFrom} from "rxjs";
import {finalize} from "rxjs/operators";
import {
  ReagentImportFileFormatInstructionsComponent
} from "./reagent-import-file-format-instructions/reagent-import-file-format-instructions.component";

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
  @Input() storage_object_id: number = 0;
  @Input() stored_reagent_id: number = 0;
  @Input() folder_name: string = "";
  @Input() file_description: string = "";

  private _metadata_import: string = "";
  @Input() set metadata_import(data_type: string) {
    this._metadata_import = data_type;
    this.uploadMultiple = !(data_type === "user_metadata" || data_type === "staff_metadata");
  }

  get metadata_import(): string {
    return this._metadata_import;
  }
  fileProgressMap: {[key: string]: {
      progress: number,
      total: number,
      status: 'pending' | 'uploading' | 'binding' | 'processing' | 'completed' | 'error',
      error?: string
    }} = {};
  fileList: File[] = [];
  uploading: boolean = false;
  fileName: string = "";
  constructor(private modal: NgbModal, private activeModal: NgbActiveModal, private web: WebService, private toastService: ToastService) { }

  close() {
    if (!this.uploading || confirm("Cancel ongoing uploads?")) {
      this.activeModal.dismiss();
    }
  }

  getFileIcon(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (['xlsx', 'xls'].includes(extension || '')) return 'bi-file-earmark-excel';
    if (['csv', 'tsv', 'txt'].includes(extension || '')) return 'bi-file-earmark-text';
    return 'bi-file-earmark';
  }

  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  getProgressPercentage(fileName: string): number {
    const progress = this.fileProgressMap[fileName];
    if (!progress || progress.total === 0) return 0;
    return Math.round((progress.progress / progress.total) * 100);
  }

  isAnyUploadInProgress(): boolean {
    return Object.values(this.fileProgressMap).some(p =>
      ['uploading', 'binding', 'processing'].includes(p.status)
    );
  }

  async retryUpload(file: File) {
    // Reset status for this file
    this.fileProgressMap[file.name] = {
      progress: 0,
      total: file.size,
      status: 'pending'
    };

    try {
      this.uploading = true;
      await this.uploadFile(file);
    } catch (error) {
      console.error("Retry upload error:", error);
    } finally {
      if (!this.isAnyUploadInProgress()) {
        this.uploading = false;
      }
    }
  }

  async uploadData(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    try {
      this.uploading = true;
      this.fileList = Array.from(files);

      // Initialize progress tracking for all files
      this.fileList.forEach(file => {
        this.fileProgressMap[file.name] = {
          progress: 0,
          total: file.size,
          status: 'pending'
        };
      });

      for (const file of this.fileList) {
        await this.uploadFile(file);
      }
    } catch (error) {
      console.error("Upload error:", error);
      this.toastService.show("Error", "An error occurred during upload", 1000, "danger");
    } finally {
      this.uploading = false;
      if (this.uploadFileInput?.nativeElement) {
        this.uploadFileInput.nativeElement.value = '';
      }
    }
  }

  // Rest of methods remain largely unchanged...
  async uploadFile(file: File) {
    const chunkSize = 1024 * 1024;
    const fileSize = file.size;
    const hashObj = new jsSHA("SHA-256", "ARRAYBUFFER");
    const progressTracker = this.fileProgressMap[file.name];
    try {
      progressTracker.status = 'uploading';
      let uploadResult: ChunkUploadResponse | null = null;

      if (fileSize <= chunkSize) {
        uploadResult = await this.uploadSmallFile(file, hashObj);
      } else {
        uploadResult = await this.uploadLargeFile(file, chunkSize, hashObj, progressTracker);
      }

      if (uploadResult?.completed_at) {
        this.toastService.show(file.name, "Upload completed", 1000, "success");
        await this.bindFile(file.name, uploadResult.id);
      }
    } catch (error: any) {
      console.error(`Error uploading ${file.name}:`, error);
      progressTracker.status = 'error';
      progressTracker.error = error.message || 'Upload failed';
      this.toastService.show(file.name, `Upload failed: ${error.message || 'Unknown error'}`, 1000, "danger");
    }
  }

  async uploadSmallFile(file: File, hashObj: jsSHA) {
    const chunk = await file.arrayBuffer();
    hashObj.update(chunk);
    const hashDigest = hashObj.getHash("HEX");

    return await firstValueFrom(
      this.web.uploadDataChunkComplete("", hashDigest, file, file.name)
    );
  }

  async uploadLargeFile(
    file: File,
    chunkSize: number,
    hashObj: jsSHA,
    progressTracker: { progress: number, total: number, status: string }
  ): Promise<any> {
    const fileSize = file.size;
    let currentURL = "";
    let currentOffset = 0;

    while (currentOffset < fileSize) {
      let end = Math.min(currentOffset + chunkSize, fileSize);
      const chunk = await file.slice(currentOffset, end).arrayBuffer();
      hashObj.update(chunk);

      const filePart = new File([chunk], file.name, {type: file.type});
      const contentRange = `bytes ${currentOffset}-${end - 1}/${fileSize}`;

      const result = await firstValueFrom(
        this.web.uploadDataChunk(currentURL, filePart, file.name, contentRange)
      );

      if (result) {
        currentURL = result.url;
        currentOffset = result.offset;
        progressTracker.progress = currentOffset;
      } else {
        throw new Error("Upload chunk failed");
      }
    }

    if (currentURL) {
      const hashDigest = hashObj.getHash("HEX");
      return await firstValueFrom(
        this.web.uploadDataChunkComplete(currentURL, hashDigest)
      );
    }

    throw new Error("Upload failed - no URL received");
  }

  async bindFile(fileName: string, fileId: string) {
    this.toastService.show(fileName, "Processing file...");
    const progressTracker = this.fileProgressMap[fileName];
    progressTracker.status = 'binding';
    try {
      if (this.stored_reagent_id > 0) {
        await this.uploadReagentDocument(fileId, fileName);
      } else if (this.storage_object_id > 0) {
        await this.importReagents(fileId, fileName);
      } else if (this.instrument_job_id && this.instrument_user_type) {
        const data = await firstValueFrom(
          this.web.bindUploadedFile(
            null,
            fileId,
            fileName,
            fileName,
            this.step_id,
            this.folder_id,
            this.instrument_job_id,
            this.instrument_user_type
          )
        );
        this.toastService.show(fileName, "Binding completed", 1000, "success");
        progressTracker.status = 'completed';

        if (this.shouldImportMetadata() && data) {
          await this.importMetadata(data);
        }
      } else {
        const data = await firstValueFrom(
          this.web.bindUploadedFile(
            this.session_id,
            fileId,
            fileName,
            fileName,
            this.step_id,
            this.folder_id
          )
        );
        this.toastService.show(fileName, "Binding completed", 1000, "success");
        progressTracker.status = 'completed';

        if (this.shouldImportMetadata() && data) {
          await this.importMetadata(data);
        }
      }
    } catch (error: any) {
      progressTracker.status = 'error';
      progressTracker.error = error.message || 'Binding failed';
      this.toastService.show(fileName, `Binding failed: ${error.message || 'Unknown error'}`, 1000, "danger");
      throw error;
    }
  }

  async importReagents(fileId: string, fileName: string) {
    const progressTracker = this.fileProgressMap[fileName];
    progressTracker.status = 'processing';

    try {
      const response = await firstValueFrom(
        this.web.importReagentFromFile(
          this.storage_object_id,
          fileId,
          this.web.cupcakeInstanceID
        )
      );
      if (response) {
        this.toastService.show(fileName, "Reagent import started", 1000, "success");
        progressTracker.status = 'completed';
        this.activeModal.close(response);
      } else {
        throw new Error("Reagent import failed");
      }
    } catch (error: any) {
      progressTracker.status = 'error';
      progressTracker.error = error.message || 'Import failed';
      this.toastService.show(
        fileName,
        `Reagent import failed: ${error.message || 'Unknown error'}`,
        3000,
        "danger"
      );
    }
  }

  shouldImportMetadata(): boolean {
    return this.metadata_import.startsWith("user_metadata") ||
      this.metadata_import.startsWith("staff_metadata") ||
      this.metadata_import.startsWith("all");
  }

  async importMetadata(annotation: Annotation) {
    try {
      await firstValueFrom(
        this.web.instrumentJobImportSDRFMetadata(
          this.instrument_job_id,
          annotation.id,
          this.web.cupcakeInstanceID,
          this.metadata_import
        )
      );
      this.toastService.show("Metadata", "Importing metadata", 1000,"success");
      this.activeModal.close();
    } catch (error: any) {
      this.toastService.show("Metadata", `Import failed: ${error.message || 'Unknown error'}`, 1000,"danger");
    }
  }

  showReagentImportInstruction() {
    this.modal.open(ReagentImportFileFormatInstructionsComponent, { size: 'lg' });
  }

  async uploadReagentDocument(fileId: string, fileName: string) {
    const progressTracker = this.fileProgressMap[fileName];
    progressTracker.status = 'processing';

    try {
      const file = this.fileList.find(f => f.name === fileName);
      if (!file) {
        throw new Error("File not found");
      }

      const response = await firstValueFrom(
        this.web.bindReagentDocumentChunkedFile(
          fileId,
          this.stored_reagent_id,
          this.folder_name,
          fileName,
          this.file_description
        )
      )

      if (response) {
        this.toastService.show(fileName, "Document uploaded successfully", 1000, "success");
        progressTracker.status = 'completed';
        this.activeModal.close(response);
      } else {
        throw new Error("Document upload failed");
      }
    } catch (error: any) {
      progressTracker.status = 'error';
      progressTracker.error = error.message || 'Upload failed';
      this.toastService.show(
        fileName,
        `Document upload failed: ${error.message || 'Unknown error'}`,
        3000,
        "danger"
      );
    }
  }
}
