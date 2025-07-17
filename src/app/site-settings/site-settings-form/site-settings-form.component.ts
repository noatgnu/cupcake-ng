import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbTooltipModule, NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { SiteSettings } from '../../site-settings';
import { SiteSettingsService } from '../../site-settings.service';
import { ToastService } from '../../toast.service';
import { BackupService } from '../../backup/backup.service';
import { BackupStatus, BackupTriggerResponse, BackupHistoryResponse, BackupProgress } from '../../backup/backup';
import { WebsocketService } from '../../websocket.service';
import { interval, Subject } from 'rxjs';
import { takeUntil, switchMap, filter } from 'rxjs/operators';
import {environment} from "../../../environments/environment";

@Component({
  selector: 'app-site-settings-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbTooltipModule,
    NgbAlertModule
  ],
  templateUrl: './site-settings-form.component.html',
  styleUrl: './site-settings-form.component.scss'
})
export class SiteSettingsFormComponent implements OnInit, OnChanges, OnDestroy {
  private _settings: SiteSettings | null = null;
  private destroy$ = new Subject<void>();

  @Input() set settings(value: SiteSettings | null) {
    this._settings = value;
    if (this.settingsForm) {
      console.log(value)
      this.populateForm();
    }
  }
  get settings(): SiteSettings | null {
    return this._settings;
  }

  @Input() activeTab = 'general';
  @Input() disabled = false;
  @Output() settingsUpdated = new EventEmitter<SiteSettings>();
  @Output() savingChange = new EventEmitter<boolean>();

  settingsForm!: FormGroup;
  saving = false;
  logoFile: File | null = null;
  faviconFile: File | null = null;
  logoPreview: string | null = null;
  faviconPreview: string | null = null;
  baseURL: string = environment.baseURL;

  // Backup-related properties
  backupStatus: BackupStatus | null = null;
  isBackupRunning = false;
  refreshingStatus = false;
  currentBackupId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private siteSettingsService: SiteSettingsService,
    private toastService: ToastService,
    private backupService: BackupService,
    private websocketService: WebsocketService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    if (this.settings) {
      this.populateForm();
    }
    this.refreshBackupStatus();
    this.initializeWebSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    if (this.settings && this.settingsForm) {
      this.populateForm();
    }
  }

  initializeForm(): void {
    this.settingsForm = this.fb.group({
      site_name: ['CUPCAKE', [Validators.required, Validators.maxLength(255)]],
      site_tagline: ['', Validators.maxLength(500)],
      banner_enabled: [false],
      banner_text: [''],
      banner_color: ['#0066cc', Validators.pattern(/^#[0-9A-Fa-f]{6}$/)],
      banner_text_color: ['#ffffff', Validators.pattern(/^#[0-9A-Fa-f]{6}$/)],
      banner_dismissible: [true],
      primary_color: ['#0066cc', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
      secondary_color: ['#6c757d', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
      footer_text: [''],
      // Import restrictions
      allow_import_protocols: [true],
      allow_import_sessions: [true],
      allow_import_annotations: [true],
      allow_import_projects: [true],
      allow_import_reagents: [true],
      allow_import_instruments: [true],
      allow_import_lab_groups: [true],
      allow_import_messaging: [true],
      allow_import_support_models: [true],
      staff_only_import_override: [false],
      import_archive_size_limit_mb: [100, [Validators.required, Validators.min(1), Validators.max(10000)]],
      // Module availability
      enable_documents_module: [true],
      enable_lab_notebook_module: [true],
      enable_instruments_module: [true],
      enable_storage_module: [true],
      enable_billing_module: [true],
      enable_ai_sdrf_suggestions: [true],
      enable_backup_module: [true],
      // Backup configuration
      backup_frequency_days: [7, [Validators.required, Validators.min(0), Validators.max(365)]]
    });
  }

  populateForm(): void {
    if (this.settings) {
      this.settingsForm.patchValue({
        site_name: this.settings.site_name || 'CUPCAKE',
        site_tagline: this.settings.site_tagline || '',
        banner_enabled: this.settings.banner_enabled || false,
        banner_text: this.settings.banner_text || '',
        banner_color: this.settings.banner_color || '#0066cc',
        banner_text_color: this.settings.banner_text_color || '#ffffff',
        banner_dismissible: this.settings.banner_dismissible !== false,
        primary_color: this.settings.primary_color || '#0066cc',
        secondary_color: this.settings.secondary_color || '#6c757d',
        footer_text: this.settings.footer_text || '',
        // Import restrictions
        allow_import_protocols: this.settings.allow_import_protocols !== false,
        allow_import_sessions: this.settings.allow_import_sessions !== false,
        allow_import_annotations: this.settings.allow_import_annotations !== false,
        allow_import_projects: this.settings.allow_import_projects !== false,
        allow_import_reagents: this.settings.allow_import_reagents !== false,
        allow_import_instruments: this.settings.allow_import_instruments !== false,
        allow_import_lab_groups: this.settings.allow_import_lab_groups !== false,
        allow_import_messaging: this.settings.allow_import_messaging !== false,
        allow_import_support_models: this.settings.allow_import_support_models !== false,
        staff_only_import_override: this.settings.staff_only_import_override || false,
        import_archive_size_limit_mb: this.settings.import_archive_size_limit_mb || 100,
        // Module availability
        enable_documents_module: this.settings.enable_documents_module !== false,
        enable_lab_notebook_module: this.settings.enable_lab_notebook_module !== false,
        enable_instruments_module: this.settings.enable_instruments_module !== false,
        enable_storage_module: this.settings.enable_storage_module !== false,
        enable_billing_module: this.settings.enable_billing_module !== false,
        enable_ai_sdrf_suggestions: this.settings.enable_ai_sdrf_suggestions !== false,
        enable_backup_module: this.settings.enable_backup_module !== false,
        // Backup configuration
        backup_frequency_days: this.settings.backup_frequency_days || 7
      });

      // Set image previews if available
      if (this.settings.logo) {
        this.logoPreview = `${this.baseURL}/api/site_settings/download_logo/`;
      }
      if (this.settings.favicon) {
        this.faviconPreview = `${this.baseURL}/api/site_settings/download_favicon/`;
      }
    }
  }

  onFileSelected(event: any, type: 'logo' | 'favicon'): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.toastService.show('Site Settings','Please select a valid image file (JPEG, PNG, GIF)', );
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.show('Site Settings', 'File size must be less than 5MB');
        return;
      }

      // Set file and preview
      if (type === 'logo') {
        this.logoFile = file;
        this.createImagePreview(file, (preview) => this.logoPreview = preview);
      } else {
        this.faviconFile = file;
        this.createImagePreview(file, (preview) => this.faviconPreview = preview);
      }
    }
  }

  createImagePreview(file: File, callback: (preview: string) => void): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      callback(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  removeImage(type: 'logo' | 'favicon'): void {
    if (type === 'logo') {
      this.logoFile = null;
      this.logoPreview = null;
    } else {
      this.faviconFile = null;
      this.faviconPreview = null;
    }
  }

  async saveSettings(): Promise<void> {
    if (this.settingsForm.invalid || this.disabled) {
      this.markFormGroupTouched();
      return;
    }
    console.log('Saving settings:', this.settings);

    this.saving = true;
    this.savingChange.emit(true);

    try {
      const formData = this.settingsForm.value;
      let updatedSettings: SiteSettings;

      if (this.settings?.id) {
        // Update existing settings
        updatedSettings = await this.siteSettingsService.updateSettings(this.settings.id, formData).toPromise() as SiteSettings;
      } else {
        // Create new settings
        updatedSettings = await this.siteSettingsService.createSettings(formData).toPromise() as SiteSettings;
      }

      // Upload images if selected
      if (this.logoFile && updatedSettings.id) {
        updatedSettings = await this.siteSettingsService.uploadLogo(updatedSettings.id, this.logoFile).toPromise() as SiteSettings;
        this.logoFile = null;
      }

      if (this.faviconFile && updatedSettings.id) {
        updatedSettings = await this.siteSettingsService.uploadFavicon(updatedSettings.id, this.faviconFile).toPromise() as SiteSettings;
        this.faviconFile = null;
      }

      this.settingsUpdated.emit(updatedSettings);
      this.saving = false;
      this.savingChange.emit(false);

    } catch (error) {
      console.error('Error saving settings:', error);
      this.toastService.show('Site Settings', 'Failed to save settings');
      this.saving = false;
      this.savingChange.emit(false);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.settingsForm.controls).forEach(key => {
      this.settingsForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.settingsForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} is too long`;
      }
      if (field.errors['pattern']) {
        return `${this.getFieldLabel(fieldName)} must be a valid hex color (e.g., #ff0000)`;
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `${this.getFieldLabel(fieldName)} must be no more than ${field.errors['max'].max}`;
      }
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'site_name': 'Site Name',
      'site_tagline': 'Site Tagline',
      'banner_text': 'Banner Text',
      'banner_color': 'Banner Color',
      'banner_text_color': 'Banner Text Color',
      'primary_color': 'Primary Color',
      'secondary_color': 'Secondary Color',
      'footer_text': 'Footer Text',
      'backup_frequency_days': 'Backup Frequency',
      'import_archive_size_limit_mb': 'Archive Size Limit'
    };
    return labels[fieldName] || fieldName;
  }

  selectAllImportTypes(): void {
    this.settingsForm.patchValue({
      allow_import_protocols: true,
      allow_import_sessions: true,
      allow_import_annotations: true,
      allow_import_projects: true,
      allow_import_reagents: true,
      allow_import_instruments: true,
      allow_import_lab_groups: true,
      allow_import_messaging: true,
      allow_import_support_models: true
    });
  }

  enableAllModules(): void {
    this.settingsForm.patchValue({
      enable_documents_module: true,
      enable_lab_notebook_module: true,
      enable_instruments_module: true,
      enable_storage_module: true,
      enable_billing_module: true,
      enable_ai_sdrf_suggestions: true,
      enable_backup_module: true
    });
  }

  deselectAllImportTypes(): void {
    this.settingsForm.patchValue({
      allow_import_protocols: false,
      allow_import_sessions: false,
      allow_import_annotations: false,
      allow_import_projects: false,
      allow_import_reagents: false,
      allow_import_instruments: false,
      allow_import_lab_groups: false,
      allow_import_messaging: false,
      allow_import_support_models: false
    });
  }

  disableAllModules(): void {
    this.settingsForm.patchValue({
      enable_documents_module: false,
      enable_lab_notebook_module: false,
      enable_instruments_module: false,
      enable_storage_module: false,
      enable_billing_module: false,
      enable_ai_sdrf_suggestions: false,
      enable_backup_module: false
    });
  }

  resetToDefaults(): void {
    if (confirm('Are you sure you want to reset all settings to default values? This cannot be undone.')) {
      this.settingsForm.reset({
        site_name: 'CUPCAKE',
        site_tagline: '',
        banner_enabled: false,
        banner_text: '',
        banner_color: '#0066cc',
        banner_text_color: '#ffffff',
        banner_dismissible: true,
        primary_color: '#0066cc',
        secondary_color: '#6c757d',
        footer_text: '',
        // Import restrictions defaults
        allow_import_protocols: true,
        allow_import_sessions: true,
        allow_import_annotations: true,
        allow_import_projects: true,
        allow_import_reagents: true,
        allow_import_instruments: true,
        allow_import_lab_groups: true,
        allow_import_messaging: true,
        allow_import_support_models: true,
        staff_only_import_override: false,
        import_archive_size_limit_mb: 100,
        // Module availability defaults
        enable_documents_module: true,
        enable_lab_notebook_module: true,
        enable_instruments_module: true,
        enable_storage_module: true,
        enable_billing_module: true,
        enable_ai_sdrf_suggestions: true,
        enable_backup_module: true,
        // Backup configuration defaults
        backup_frequency_days: 7
      });
      this.removeImage('logo');
      this.removeImage('favicon');
    }
  }

  // WebSocket initialization
  initializeWebSocket(): void {
    // Connect to user WebSocket if not already connected
    if (!this.websocketService.userConnected) {
      this.websocketService.connectUserWS();
    }

    // Listen for backup progress messages
    if (this.websocketService.userWSConnection) {
      this.websocketService.userWSConnection
        .pipe(
          takeUntil(this.destroy$),
          filter((message: any) => message.type === 'backup_progress')
        )
        .subscribe({
          next: (message: any) => {
            this.handleBackupProgressMessage(message.message);
          },
          error: (error) => {
            console.error('WebSocket error:', error);
          }
        });
    }
  }

  handleBackupProgressMessage(message: any): void {
    const { backup_id, progress, status, message: statusMessage } = message;
    
    // Update backup status
    this.backupStatus = {
      status: status as BackupStatus['status'],
      message: statusMessage,
      progress: progress >= 0 ? progress : undefined
    };

    // Update running state
    this.isBackupRunning = status === 'in_progress' || status === 'starting';
    
    // Update current backup ID
    if (backup_id) {
      this.currentBackupId = backup_id;
    }

    // Show toast notifications for completion or failure
    if (status === 'completed') {
      this.toastService.show('Backup', 'Backup completed successfully!');
      this.isBackupRunning = false;
      this.currentBackupId = null;
    } else if (status === 'failed') {
      this.toastService.show('Backup', 'Backup failed');
      this.isBackupRunning = false;
      this.currentBackupId = null;
    }
  }

  // Backup-related methods
  triggerManualBackup(): void {
    if (this.isBackupRunning) {
      return;
    }

    this.isBackupRunning = true;
    this.backupStatus = {
      status: 'in_progress',
      message: 'Starting manual backup...',
      details: 'Initializing backup process',
      progress: 0
    };

    this.backupService.triggerManualBackup('manual')
      .subscribe({
        next: (response: BackupTriggerResponse) => {
          this.currentBackupId = response.backup_id;
          this.toastService.show('Backup', 'Manual backup started successfully');
          // WebSocket will handle progress tracking automatically
        },
        error: (error) => {
          console.error('Failed to trigger backup:', error);
          this.toastService.show('Backup', 'Failed to start backup');
          this.isBackupRunning = false;
          this.backupStatus = {
            status: 'failed',
            message: 'Failed to start backup',
            details: error.error?.detail || 'Unknown error occurred'
          };
        }
      });
  }

  refreshBackupStatus(): void {
    this.refreshingStatus = true;
    
    this.backupService.getCurrentBackupStatus()
      .subscribe({
        next: (response: BackupStatus) => {
          this.backupStatus = response;
          
          // Check if there's an active backup
          if (response.status === 'in_progress' && response.backup_id) {
            this.currentBackupId = response.backup_id;
            this.isBackupRunning = true;
            // WebSocket will handle progress tracking automatically
          } else {
            this.isBackupRunning = false;
            this.currentBackupId = null;
          }
          
          this.refreshingStatus = false;
        },
        error: (error) => {
          console.error('Failed to get backup status:', error);
          this.backupStatus = {
            status: 'error',
            message: 'Unable to fetch backup status',
            details: 'Check server connection'
          };
          this.refreshingStatus = false;
        }
      });
  }

  viewBackupHistory(): void {
    // This could open a modal or navigate to a backup history page
    this.backupService.getBackupHistory(30, 10)
      .subscribe({
        next: (response: BackupHistoryResponse) => {
          // For now, just show recent backup info in a toast
          const recentBackup = response.backups?.[0];
          if (recentBackup) {
            const date = new Date(recentBackup.created_at).toLocaleString();
            this.toastService.show('Backup History', 
              `Last backup: ${date} (${recentBackup.status})`
            );
          } else {
            this.toastService.show('Backup History', 'No backup history found');
          }
        },
        error: (error) => {
          console.error('Failed to get backup history:', error);
          this.toastService.show('Backup History', 'Failed to load backup history');
        }
      });
  }

}
