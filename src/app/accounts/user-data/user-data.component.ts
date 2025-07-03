import { Component, OnDestroy, OnInit } from '@angular/core';
import {WebService} from "../../web.service";
import {ToastService} from "../../toast.service";
import {NgbProgressbar, NgbCollapse} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";
import jsSHA from "jssha";
import {environment} from "../../../environments/environment";
import {WebsocketService} from "../../websocket.service";
import { Subscription } from 'rxjs';
import {DecimalPipe, NgClass} from "@angular/common";
import {keyBy} from "lodash-es";
import { AvailableImportOptionsResponse, ImportOptions } from '../../site-settings';
import { AccountsService } from '../accounts.service';

@Component({
    selector: 'app-user-data',
  imports: [
    NgbProgressbar,
    NgbCollapse,
    FormsModule,
    DecimalPipe,
    NgClass
  ],
    templateUrl: './user-data.component.html',
    styleUrl: './user-data.component.scss'
})
export class UserDataComponent implements OnInit, OnDestroy {
  chunkUploadProgress = 0;
  chunkUploadTotal = 0;
  selectedFormat: 'zip' | 'tar.gz' = 'zip';
  webSubscription?: Subscription;
  progress = 0;
  exportInProgress = false;
  exportMessage = '';
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

  // Collapse state for import options
  importOptionsCollapsed = false;

  // Available import options from site settings
  availableImportOptions: ImportOptions = {
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

  isStaffOverride = false;
  maxArchiveSizeMB?: number;
  loadingOptions = false;
  progressImport = 0;
  importInProgress = false;
  importMessage = '';

  // Dry run state
  dryRunInProgress = false;
  dryRunCompleted = false;
  dryRunProgress = 0;
  dryRunMessage = '';
  currentUploadId: string | null = null;

  dryRunAnalysisReport: {
    'archive_info': {[key: string]: number},
    'data_summary': {[key: string]: number},
    'potential_conflicts': Array<string>,
    'size_analysis': {'total_media_files': number,
      'total_media_size_bytes': number,
      'total_media_size_mb': number,
      'large_files': {'name': string, 'size_mb': number}[],
      'file_types': {[key: string]: number}
    }| null,
    'import_plan': {},
    'warnings': Array<string>,
    'errors': Array<string>
  }| null = null;


  constructor(
    private web: WebService,
    private toastService: ToastService,
    private ws: WebsocketService,
    public accountsService: AccountsService
  ) {
    this.webSubscription = this.ws.userWSConnection?.subscribe((data) => {
      if (data) {
        // Handle progress updates
        if ("export_type" in data && "instance_id" in data && "progress" in data) {
          if (data["progress"] > this.progress && data["status"] !== "error") {
            this.progress = data["progress"];
            this.exportInProgress = this.progress < 100;
            this.exportMessage = data["message"]

          }

        }

        if ("import_type" in data && "instance_id" in data && "progress" in data) {
          if (data["import_type"] === "dry_run_analysis") {
            // Handle dry run progress
            if (data["progress"] > this.dryRunProgress && data["status"] !== "error") {
              this.dryRunProgress = data["progress"];
              this.dryRunInProgress = this.dryRunProgress < 100;
              this.dryRunMessage = data["message"];

              if ("analysis_report" in data) {
                this.dryRunAnalysisReport = data["analysis_report"];
                this.dryRunCompleted = true;
                this.dryRunInProgress = false;
              }
            }
          } else if (data["import_type"] === "user_data") {
            // Handle actual import progress
            if (data["progress"] > this.progressImport && data["status"] !== "error") {
              this.progressImport = data["progress"];
              this.importInProgress = this.progressImport < 100;
              this.importMessage = data["message"];
            }
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

  ngOnInit() {
    this.loadAvailableImportOptions();
  }

  loadAvailableImportOptions() {
    this.loadingOptions = true;
    this.web.getAvailableImportOptions().subscribe({
      next: (response: AvailableImportOptionsResponse) => {
        this.availableImportOptions = response.available_options;
        this.isStaffOverride = response.is_staff_override;
        this.maxArchiveSizeMB = response.max_archive_size_mb;

        // Update importOptions to only enable allowed options
        Object.keys(this.importOptions).forEach(key => {
          const optionKey = key as keyof ImportOptions;
          if (!this.availableImportOptions[optionKey]) {
            (this.importOptions as any)[key] = false;
          }
        });

        this.loadingOptions = false;
      },
      error: (error) => {
        console.error('Error loading available import options:', error);
        this.toastService.show('Import Options', 'Failed to load available import options');
        this.loadingOptions = false;
      }
    });
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
      const optionKey = key as keyof ImportOptions;
      // Only enable if it's available according to site settings
      (this.importOptions as any)[key] = this.availableImportOptions[optionKey] === true;
    });
  }

  deselectAllImportOptions() {
    Object.keys(this.importOptions).forEach(key => {
      (this.importOptions as any)[key] = false;
    });
  }

  isImportOptionDisabled(option: keyof ImportOptions): boolean {
    // If user has staff override privileges, don't disable any options
    if (this.isStaffOverride && this.accountsService.is_staff) {
      return false;
    }
    return this.availableImportOptions[option] !== true;
  }

  getDisabledOptionTooltip(option: keyof ImportOptions): string {
    if (this.isStaffOverride && this.accountsService.is_staff) {
      return 'This option is disabled by site settings, but you have staff override privileges';
    }
    return 'This option has been disabled by site administrator';
  }

  async importUserData(event: Event){
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      // Reset dry run state
      this.resetDryRunState();

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
          this.currentUploadId = result.id;
          this.startDryRunAnalysis();
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
            this.currentUploadId = result.id;
            this.startDryRunAnalysis();
          }
        }
      }
    }
  }

  startDryRunAnalysis() {
    if (!this.currentUploadId) return;

    this.dryRunInProgress = true;
    this.dryRunProgress = 0;
    this.dryRunCompleted = false;
    this.dryRunAnalysisReport = null;

    this.web.dryRunImportUserData(this.currentUploadId, this.importOptions).subscribe({
      next: (response) => {
        this.toastService.show("User Data", "Starting dry run analysis...");
      },
      error: (error) => {
        console.error('Error starting dry run analysis:', error);
        this.toastService.show("User Data", "Failed to start dry run analysis");
        this.dryRunInProgress = false;
      }
    });
  }

  proceedWithImport() {
    if (!this.currentUploadId) return;

    this.progressImport = 0;
    this.importInProgress = true;

    this.web.importUserData(this.currentUploadId, this.importOptions).subscribe({
      next: (response) => {
        this.toastService.show("User Data", "Starting import process...");
      },
      error: (error) => {
        console.error('Error starting import:', error);
        this.toastService.show("User Data", "Failed to start import");
        this.importInProgress = false;
      }
    });
  }

  resetDryRunState() {
    this.dryRunInProgress = false;
    this.dryRunCompleted = false;
    this.dryRunProgress = 0;
    this.dryRunMessage = '';
    this.dryRunAnalysisReport = null;
    this.currentUploadId = null;
  }

  cancelImport() {
    this.resetDryRunState();
    this.chunkUploadProgress = 0;
    this.chunkUploadTotal = 0;
  }

  hasErrors(): boolean {
    if (!this.dryRunAnalysisReport) return false;
    return this.dryRunAnalysisReport.errors.length > 0 || false;
  }

  hasWarnings(): boolean {
    if (!this.dryRunAnalysisReport) return false;
    return this.dryRunAnalysisReport.warnings.length > 0 || false;
  }

  getFileTypesArray(): {type: string, count: number}[] {
    if (!this.dryRunAnalysisReport?.size_analysis?.file_types) return [];
    return Object.entries(this.dryRunAnalysisReport.size_analysis.file_types)
      .map(([type, count]) => ({type, count}));
  }

  ngOnDestroy() {
    if (this.webSubscription) {
      this.webSubscription.unsubscribe();
    }
  }
}
