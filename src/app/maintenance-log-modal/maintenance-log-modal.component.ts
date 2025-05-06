import { Component, OnInit, Input } from '@angular/core';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MaintenanceLogService } from '../maintenance-log.service';
import {MaintenanceLog, MaintenanceLogCreate, MaintenanceLogQuery} from "../maintenance-log";
import {DatePipe, NgClass} from "@angular/common";


@Component({
  selector: 'app-maintenance-log-modal',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    FormsModule,
    NgClass
  ],
  templateUrl: './maintenance-log-modal.component.html',
  styleUrl: './maintenance-log-modal.component.scss'
})
export class MaintenanceLogModalComponent implements OnInit {
  @Input() data: MaintenanceLog | null = null;
  @Input() instrumentId: number | null = null;

  logForm!: FormGroup;
  maintenanceTypes: {value: string, label: string}[] = [];
  statusTypes: {value: string, label: string}[] = [];

  @Input() activeTab = 'new';
  @Input() mode: 'view' | 'edit' | 'create' = 'create';


  templates: MaintenanceLogQuery | null = null;
  selectedTemplateId: number | null = null;
  selectedTemplate: MaintenanceLog | null = null;

  isLoading = false;
  error: string | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private maintenanceLogService: MaintenanceLogService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadMaintenanceTypes();
    this.loadStatusTypes();

    if (this.data?.is_template) {
      this.activeTab = 'manage';
      this.loadTemplates();
    }
  }

  initializeForm(): void {
    this.logForm = this.fb.group({
      maintenance_type: [this.data?.maintenance_type || '', Validators.required],
      maintenance_date: [this.formatDate(this.data?.maintenance_date) || this.formatDate(new Date()), Validators.required],
      maintenance_description: [this.data?.maintenance_description || '', Validators.required],
      maintenance_notes: [this.data?.maintenance_notes || ''],
      status: [this.data?.status || 'pending'],
      is_template: [this.data?.is_template || false]
    });
  }

  switchToEditMode(): void {
    this.mode = 'edit';
    this.initializeForm();
  }

  loadMaintenanceTypes(): void {
    this.maintenanceLogService.getMaintenanceTypes().subscribe({
      next: (types) => this.maintenanceTypes = types,
      error: (err) => this.error = 'Failed to load maintenance types'
    });
  }

  loadStatusTypes(): void {
    this.maintenanceLogService.getStatusTypes().subscribe({
      next: (types) => this.statusTypes = types,
      error: (err) => this.error = 'Failed to load status types'
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'template' || tab === 'manage') {
      this.loadTemplates();
    }
  }

  loadTemplates(): void {
    this.isLoading = true;
    this.maintenanceLogService.getTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load templates';
        this.isLoading = false;
      }
    });
  }

  getTemplateDetails(): void {
    if (this.selectedTemplateId) {
      this.isLoading = true;
      this.maintenanceLogService.getMaintenanceLogTemplate(this.selectedTemplateId).subscribe({
        next: (template) => {
          this.selectedTemplate = template;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load template details';
          this.isLoading = false;
        }
      });
    }
  }

  createFromTemplate(): void {
    if (this.selectedTemplateId) {
      this.isLoading = true;
      this.maintenanceLogService.createFromTemplate(this.selectedTemplateId).subscribe({
        next: (log) => {
          this.isLoading = false;
          this.activeModal.close(log);
        },
        error: (err) => {
          this.error = 'Failed to create log from template';
          this.isLoading = false;
        }
      });
    }
  }

  saveLog(): void {
    if (this.logForm.invalid) return;

    const formData = this.logForm.value;
    formData.instrument = this.instrumentId;

    this.isLoading = true;

    if (this.data?.id) {
      this.maintenanceLogService.updateMaintenanceLog(this.data.id, formData).subscribe({
        next: (log) => {
          this.isLoading = false;
          this.activeModal.close(log);
        },
        error: (err) => {
          this.error = 'Failed to update log';
          this.isLoading = false;
        }
      });
    } else {
      this.maintenanceLogService.createMaintenanceLog(formData).subscribe({
        next: (log) => {
          this.isLoading = false;
          this.activeModal.close(log);
        },
        error: (err) => {
          this.error = 'Failed to create log';
          this.isLoading = false;
        }
      });
    }
  }

  editTemplate(template: MaintenanceLog): void {
    this.data = template;
    this.initializeForm();
    this.activeTab = 'new';
  }

  deleteTemplate(id: number): void {
    if (confirm('Are you sure you want to delete this template?')) {
      this.isLoading = true;
      this.maintenanceLogService.deleteMaintenanceLog(id).subscribe({
        next: () => {
          this.loadTemplates();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to delete template';
          this.isLoading = false;
        }
      });
    }
  }

  getTypeLabel(type: string): string {
    const found = this.maintenanceTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }
}
