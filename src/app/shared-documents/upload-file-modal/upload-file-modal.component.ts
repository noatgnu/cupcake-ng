import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbProgressbar } from '@ng-bootstrap/ng-bootstrap';
import jsSHA from 'jssha';
import { WebService, ChunkUploadResponse } from '../../web.service';
import { SharedDocumentService } from '../shared-document.service';
import { DocumentBindRequest } from '../shared-document';
import { ToastService } from '../../toast.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-upload-file-modal',
  imports: [CommonModule, FormsModule, NgbProgressbar],
  templateUrl: './upload-file-modal.component.html',
  styleUrl: './upload-file-modal.component.scss'
})
export class UploadFileModalComponent {
  @ViewChild('uploadFileInput') uploadFileInput: ElementRef | undefined;
  @Input() parentFolderId: number | null = null;
  @Input() currentPath: string = 'Root';

  fileProgressMap: {[key: string]: {
    progress: number,
    total: number,
    status: 'pending' | 'uploading' | 'binding' | 'completed' | 'error',
    error?: string
  }} = {};
  fileList: File[] = [];
  uploading = false;

  constructor(
    private activeModal: NgbActiveModal,
    private webService: WebService,
    private sharedDocumentService: SharedDocumentService,
    private toastService: ToastService
  ) {}

  close(): void {
    if (!this.uploading || confirm('Cancel ongoing uploads?')) {
      this.activeModal.dismiss();
    }
  }

  async uploadFiles(event: Event): Promise<void> {
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
      console.error('Upload error:', error);
      this.toastService.show('Error', 'An error occurred during upload', 5000, 'danger');
    } finally {
      this.uploading = false;
      if (this.uploadFileInput?.nativeElement) {
        this.uploadFileInput.nativeElement.value = '';
      }
    }
  }

  async uploadFile(file: File): Promise<void> {
    const chunkSize = 1024 * 1024; // 1MB chunks
    const fileSize = file.size;
    const hashObj = new jsSHA('SHA-256', 'ARRAYBUFFER');
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
        this.toastService.show(file.name, 'Upload completed', 3000, 'success');
        await this.bindFile(file.name, uploadResult.id);
      }
    } catch (error: any) {
      console.error(`Error uploading ${file.name}:`, error);
      progressTracker.status = 'error';
      progressTracker.error = error.message || 'Upload failed';
      this.toastService.show(file.name, `Upload failed: ${error.message || 'Unknown error'}`, 5000, 'danger');
    }
  }

  async uploadSmallFile(file: File, hashObj: jsSHA): Promise<ChunkUploadResponse> {
    const chunk = await file.arrayBuffer();
    hashObj.update(chunk);
    const hashDigest = hashObj.getHash('HEX');

    return await firstValueFrom(
      this.webService.uploadDataChunkComplete('', hashDigest, file, file.name)
    );
  }

  async uploadLargeFile(
    file: File,
    chunkSize: number,
    hashObj: jsSHA,
    progressTracker: { progress: number, total: number, status: string }
  ): Promise<ChunkUploadResponse> {
    const fileSize = file.size;
    let currentURL = '';
    let currentOffset = 0;

    while (currentOffset < fileSize) {
      const end = Math.min(currentOffset + chunkSize, fileSize);
      const chunk = await file.slice(currentOffset, end).arrayBuffer();
      hashObj.update(chunk);

      const filePart = new File([chunk], file.name, { type: file.type });
      const contentRange = `bytes ${currentOffset}-${end - 1}/${fileSize}`;

      const result = await firstValueFrom(
        this.webService.uploadDataChunk(currentURL, filePart, file.name, contentRange)
      );

      if (result) {
        currentURL = result.url;
        currentOffset = result.offset;
        progressTracker.progress = currentOffset;
      } else {
        throw new Error('Upload chunk failed');
      }
    }

    if (currentURL) {
      const hashDigest = hashObj.getHash('HEX');
      return await firstValueFrom(
        this.webService.uploadDataChunkComplete(currentURL, hashDigest)
      );
    }

    throw new Error('Upload failed - no URL received');
  }

  async bindFile(fileName: string, fileId: string): Promise<void> {
    const progressTracker = this.fileProgressMap[fileName];
    progressTracker.status = 'binding';

    try {
      const request: DocumentBindRequest = {
        chunked_upload_id: fileId,
        annotation_name: fileName,
        annotation_type: 'file'
      };

      if (this.parentFolderId !== null) {
        request.folder = this.parentFolderId;
      }

      const result = await firstValueFrom(
        this.sharedDocumentService.bindChunkedFile(request)
      );

      this.toastService.show(fileName, 'File uploaded successfully', 3000, 'success');
      progressTracker.status = 'completed';

      // Close modal if all files are completed or errored
      if (this.areAllFilesCompleted()) {
        this.activeModal.close(true);
      }
    } catch (error: any) {
      progressTracker.status = 'error';
      progressTracker.error = error.message || 'Binding failed';
      this.toastService.show(fileName, `Binding failed: ${error.message || 'Unknown error'}`, 5000, 'danger');
      throw error;
    }
  }

  getFileIcon(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'bi-file-earmark-pdf';
      case 'doc':
      case 'docx': return 'bi-file-earmark-word';
      case 'xls':
      case 'xlsx': return 'bi-file-earmark-excel';
      case 'ppt':
      case 'pptx': return 'bi-file-earmark-ppt';
      case 'txt': return 'bi-file-earmark-text';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'bi-file-earmark-image';
      case 'zip':
      case 'rar': return 'bi-file-earmark-zip';
      default: return 'bi-file-earmark';
    }
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
      ['uploading', 'binding'].includes(p.status)
    );
  }

  areAllFilesCompleted(): boolean {
    return Object.values(this.fileProgressMap).every(p =>
      ['completed', 'error'].includes(p.status)
    );
  }

  async retryUpload(file: File): Promise<void> {
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
      console.error('Retry upload error:', error);
    } finally {
      if (!this.isAnyUploadInProgress()) {
        this.uploading = false;
      }
    }
  }
}