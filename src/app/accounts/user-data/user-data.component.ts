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
import { AvailableImportOptionsResponse, ImportOptions, AvailableStorageObject } from '../../site-settings';
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
  uploadInProgress = false;
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
  dryRunError: string | null = null;
  currentUploadId: string | null = null;

  // Import process states
  importProcessStep: 'upload' | 'analyzing' | 'review' | 'importing' | 'completed' | 'error' = 'upload';
  importCompleted = false;
  importError: string | null = null;
  importSuccessMessage = '';

  dryRunAnalysisReport: {
    'archive_info': {[key: string]: any},
    'data_summary': {[key: string]: number},
    'potential_conflicts': Array<{
      type: string;
      description: string;
      items: string[];
      total_conflicts: number;
    }>,
    'size_analysis': {
      'total_media_files': number,
      'total_media_size_bytes': number,
      'total_media_size_mb': number,
      'large_files': {'name': string, 'size_mb': number}[],
      'file_types': {[key: string]: number}
    } | null,
    'import_plan': any,
    'warnings': Array<string>,
    'errors': Array<string>,
    'storage_object_requirements'?: {
      'total_stored_reagents': number,
      'required_storage_objects': Array<{
        id: number,
        object_name: string,
        object_type: string,
        reagent_count: number
      }>,
      'description': string
    }
  } | null = null;

  // Storage object nomination
  availableStorageObjects: AvailableStorageObject[] = [];
  storageObjectMappings: { [originalStorageId: string]: number } = {};
  loadingStorageObjects = false;
  storageObjectNominationRequired = false;


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
            if (data["status"] === "error") {
              this.dryRunInProgress = false;
              this.dryRunError = data["error_details"] || data["message"] || "Analysis failed";
              this.importProcessStep = 'error';
              this.toastService.show("Import Analysis", `Analysis failed: ${this.dryRunError}`, undefined,"error");
            } else if (data["progress"] >= this.dryRunProgress) {
              this.dryRunProgress = data["progress"];
              this.dryRunMessage = data["message"];
              this.dryRunInProgress = this.dryRunProgress < 100;
              this.importProcessStep = 'analyzing';

              if (data["progress"] === 100 && "analysis_report" in data) {
                this.dryRunAnalysisReport = data["analysis_report"];
                this.dryRunCompleted = true;
                this.dryRunInProgress = false;
                this.importProcessStep = 'review';

                // Check if storage object nomination is required
                this.checkStorageObjectRequirements();

                this.toastService.show("Import Analysis", "Analysis completed successfully!");
              }
            }
          } else if (data["import_type"] === "user_data") {
            // Handle actual import progress
            if (data["status"] === "error") {
              this.importInProgress = false;
              this.importError = data["error_details"] || data["message"] || "Import failed";
              this.importProcessStep = 'error';
              this.toastService.show("Import", `Import failed: ${this.importError}`, undefined, "danger");
            } else if (data["progress"] >= this.progressImport) {
              this.progressImport = data["progress"];
              this.importMessage = data["message"];
              this.importInProgress = this.progressImport < 100;
              this.importProcessStep = 'importing';

              if (data["progress"] === 100) {
                this.importInProgress = false;
                this.importCompleted = true;
                this.importProcessStep = 'completed';
                this.importSuccessMessage = data["message"] || "Import completed successfully!";
                this.toastService.show("Import", this.importSuccessMessage, undefined,"success");
              }
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

  async importUserData(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      try {
        // Reset all import state
        this.resetImportState();
        this.importProcessStep = 'upload';

        // Set upload progress immediately
        this.uploadInProgress = true;
        this.chunkUploadTotal = file.size;
        this.chunkUploadProgress = 0;

        // Validate file size if limit is set
        if (this.maxArchiveSizeMB) {
          const fileSizeMB = file.size / (1024 * 1024);
          if (fileSizeMB > this.maxArchiveSizeMB) {
            this.uploadInProgress = false;
            this.toastService.show("Import", `File size (${fileSizeMB.toFixed(1)} MB) exceeds maximum allowed size (${this.maxArchiveSizeMB} MB)`, undefined,"danger");
            this.importProcessStep = 'error';
            this.importError = `File too large: ${fileSizeMB.toFixed(1)} MB (max: ${this.maxArchiveSizeMB} MB)`;
            return;
          }
        }

        const chunkSize = 1024 * 1024;
        const fileSize = file.size;
        const hashObj = new jsSHA("SHA-256", "ARRAYBUFFER");

        this.toastService.show("Import", "Starting file upload...");

        if (chunkSize > fileSize) {
          // Single chunk upload
          const chunk = await file.arrayBuffer();
          hashObj.update(chunk);
          const hashDigest = hashObj.getHash("HEX");
          const result = await this.web.uploadDataChunkComplete("", hashDigest, file, file.name).toPromise();
          this.chunkUploadProgress = fileSize;

          if (result?.completed_at) {
            this.currentUploadId = result.id;
            this.uploadInProgress = false;
            this.toastService.show("Import", "Upload completed, starting analysis...");
            await this.startDryRunAnalysis();
          }
        } else {
          // Multi-chunk upload
          let currentURL = "";
          let currentOffset = 0;

          while (fileSize > currentOffset) {
            let end = currentOffset + chunkSize;
            if (end >= fileSize) {
              end = fileSize;
            }

            const chunk = await file.slice(currentOffset, end).arrayBuffer();
            hashObj.update(chunk);
            const filePart = new File([chunk], file.name, { type: file.type });
            const contentRange = `bytes ${currentOffset}-${end - 1}/${fileSize}`;

            const result = await this.web.uploadDataChunk(currentURL, filePart, file.name, contentRange).toPromise();
            if (result) {
              currentURL = result.url;
              currentOffset = result.offset;
              this.chunkUploadProgress = currentOffset;
            }
          }

          if (currentURL !== "") {
            const hashDigest = hashObj.getHash("HEX");
            const result = await this.web.uploadDataChunkComplete(currentURL, hashDigest).toPromise();

            if (result?.completed_at) {
              this.currentUploadId = result.id;
              this.uploadInProgress = false;
              this.toastService.show("Import", "Upload completed, starting analysis...");
              await this.startDryRunAnalysis();
            }
          }
        }
      } catch (error) {
        console.error('Error during file upload:', error);
        this.uploadInProgress = false;
        this.importProcessStep = 'error';
        this.importError = 'Failed to upload file. Please try again.';
        this.toastService.show("Import", "Upload failed", undefined,"danger");
      }
    }
  }

  async startDryRunAnalysis() {
    if (!this.currentUploadId) return;

    this.dryRunInProgress = true;
    this.dryRunProgress = 0;
    this.dryRunCompleted = false;
    this.dryRunAnalysisReport = null;
    this.dryRunError = null;
    this.importProcessStep = 'analyzing';

    try {
      const response = await this.web.dryRunImportUserData(this.currentUploadId, this.importOptions).toPromise();
      this.toastService.show("Import Analysis", "Analysis started...");
    } catch (error) {
      console.error('Error starting dry run analysis:', error);
      this.dryRunInProgress = false;
      this.importProcessStep = 'error';
      this.dryRunError = 'Failed to start analysis. Please try again.';
      this.toastService.show("Import Analysis", "Failed to start analysis", undefined, "danger");
    }
  }

  async proceedWithImport() {
    if (!this.currentUploadId || this.hasErrors()) return;

    this.progressImport = 0;
    this.importInProgress = true;
    this.importError = null;
    this.importProcessStep = 'importing';

    try {
      const response = await this.web.importUserData(
        this.currentUploadId,
        this.importOptions,
        this.storageObjectMappings
      ).toPromise();
      this.toastService.show("Import", "Import process started...");
    } catch (error) {
      console.error('Error starting import:', error);
      this.importInProgress = false;
      this.importProcessStep = 'error';
      this.importError = 'Failed to start import. Please try again.';
      this.toastService.show("Import", "Failed to start import", undefined, "danger");
    }
  }

  resetImportState() {
    // Reset all import-related state
    this.dryRunInProgress = false;
    this.dryRunCompleted = false;
    this.dryRunProgress = 0;
    this.dryRunMessage = '';
    this.dryRunError = null;
    this.dryRunAnalysisReport = null;
    this.currentUploadId = null;
    this.chunkUploadProgress = 0;
    this.chunkUploadTotal = 0;
    this.uploadInProgress = false;
    this.progressImport = 0;
    this.importInProgress = false;
    this.importMessage = '';
    this.importCompleted = false;
    this.importError = null;
    this.importSuccessMessage = '';
    this.importProcessStep = 'upload';

    // Reset storage object nomination state
    this.storageObjectNominationRequired = false;
    this.storageObjectMappings = {};
    this.availableStorageObjects = [];
    this.loadingStorageObjects = false;
  }

  cancelImport() {
    this.resetImportState();
    this.toastService.show("Import", "Import cancelled");
  }

  startNewImport() {
    this.resetImportState();
    // Reset file input
    const fileInput = document.getElementById('importUserData') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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

  // Helper methods for better UI display
  getImportSummaryStats(): {label: string, value: number, icon: string, color: string}[] {
    if (!this.dryRunAnalysisReport?.data_summary) return [];

    const statsConfig = [
      { key: 'protocols', label: 'Protocols', icon: 'bi-file-text', color: 'text-primary' },
      { key: 'sessions', label: 'Sessions', icon: 'bi-play-circle', color: 'text-success' },
      { key: 'annotations', label: 'Annotations', icon: 'bi-pencil', color: 'text-info' },
      { key: 'projects', label: 'Projects', icon: 'bi-folder', color: 'text-warning' },
      { key: 'reagents', label: 'Reagents', icon: 'bi-flask', color: 'text-danger' },
      { key: 'instruments', label: 'Instruments', icon: 'bi-cpu', color: 'text-secondary' }
    ];

    return statsConfig
      .filter(config => this.dryRunAnalysisReport!.data_summary[config.key] > 0)
      .map(config => ({
        label: config.label,
        value: this.dryRunAnalysisReport!.data_summary[config.key],
        icon: config.icon,
        color: config.color
      }));
  }

  getAnalysisStatusIcon(): string {
    if (this.importProcessStep === 'error' || this.hasErrors()) return 'bi-exclamation-triangle';
    if (this.hasWarnings()) return 'bi-info-circle';
    if (this.dryRunCompleted) return 'bi-check-circle';
    return 'bi-clock';
  }

  getAnalysisStatusColor(): string {
    if (this.importProcessStep === 'error' || this.hasErrors()) return 'text-danger';
    if (this.hasWarnings()) return 'text-warning';
    if (this.dryRunCompleted) return 'text-success';
    return 'text-info';
  }

  getProcessStepText(): string {
    switch (this.importProcessStep) {
      case 'upload': return 'Ready to upload';
      case 'analyzing': return 'Analyzing import file...';
      case 'review': return 'Review and confirm';
      case 'importing': return 'Importing data...';
      case 'completed': return 'Import completed!';
      case 'error': return 'Error occurred';
      default: return 'Unknown state';
    }
  }

  isImportDisabled(): boolean {
    return this.uploadInProgress ||
           this.chunkUploadProgress > 0 && this.chunkUploadProgress < this.chunkUploadTotal ||
           this.dryRunInProgress ||
           this.importInProgress ||
           this.importProcessStep === 'importing' ||
           this.importProcessStep === 'analyzing';
  }

  checkStorageObjectRequirements() {
    if (this.dryRunAnalysisReport?.storage_object_requirements) {
      this.storageObjectNominationRequired = true;
      this.loadAvailableStorageObjects();

      // Initialize mappings with default empty values
      const requiredObjects = this.dryRunAnalysisReport.storage_object_requirements.required_storage_objects;
      requiredObjects.forEach(obj => {
        this.storageObjectMappings[obj.id.toString()] = 0; // Default to unselected
      });
    }
  }

  loadAvailableStorageObjects() {
    this.loadingStorageObjects = true;
    this.web.getAvailableStorageObjects().subscribe({
      next: (response) => {
        this.availableStorageObjects = response.storage_objects;
        this.loadingStorageObjects = false;
      },
      error: (error) => {
        console.error('Error loading storage objects:', error);
        this.toastService.show('Storage Objects', 'Failed to load available storage objects', undefined, 'error');
        this.loadingStorageObjects = false;
      }
    });
  }

  isStorageObjectMappingComplete(): boolean {
    if (!this.storageObjectNominationRequired) return true;

    const requiredObjects = this.dryRunAnalysisReport?.storage_object_requirements?.required_storage_objects || [];
    return requiredObjects.every(obj => {
      const mappedId = this.storageObjectMappings[obj.id.toString()];
      return mappedId && mappedId > 0;
    });
  }

  onStorageObjectMappingChange(originalStorageId: string, event: Event) {
    if (!(event.target instanceof HTMLSelectElement)) return;
    const nominatedStorageId = parseInt(event.target.value, 10);
    this.storageObjectMappings[originalStorageId] = nominatedStorageId;
  }

  ngOnDestroy() {
    if (this.webSubscription) {
      this.webSubscription.unsubscribe();
    }
  }
}
