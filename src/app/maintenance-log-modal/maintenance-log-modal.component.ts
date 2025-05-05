import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MaintenanceLogService } from '../maintenance-log.service';
import {MaintenanceLog} from "../maintenance-log";
import {DatePipe} from "@angular/common";


@Component({
  selector: 'app-maintenance-log-modal',
  imports: [
    ReactiveFormsModule,
    DatePipe
  ],
  templateUrl: './maintenance-log-modal.component.html',
  styleUrl: './maintenance-log-modal.component.scss'
})
export class MaintenanceLogModalComponent implements OnInit {
  private _maintenanceLogId?: number;
  @Input() set maintenanceLogId(value: number | undefined) {
    this._maintenanceLogId = value;
  }
  get maintenanceLogId(): number | undefined {
    return this._maintenanceLogId;
  }
  private _instrumentId?: number;
  @Input() set instrumentId(value: number | undefined) {
    this._instrumentId = value;
  }
  get instrumentId(): number | undefined {
    return this._instrumentId;
  }
  @Input() mode: 'view' | 'edit' | 'create' = 'view';

  maintenanceForm: FormGroup;
  maintenanceLog: MaintenanceLog | null = null;
  isLoading = false;
  error = '';
  maintenanceTypes: Array<{value: string, label: string}> = [];
  statusTypes: Array<{value: string, label: string}> = [];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private maintenanceService: MaintenanceLogService
  ) {
    this.maintenanceForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadMaintenanceTypes();
    this.loadStatusTypes();

    if (this.maintenanceLogId && (this.mode === 'view' || this.mode === 'edit')) {
      this.loadMaintenanceLog();
    }

    if (this.mode !== 'edit' && this.mode !== 'create') {
      this.maintenanceForm.disable();
    }

    if (this.mode === 'create' && this.instrumentId) {
      this.maintenanceForm.patchValue({
        instrument: this.instrumentId
      });
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      instrument: ['', Validators.required],
      maintenance_type: ['routine', Validators.required],
      maintenance_description: ['', Validators.required],
      maintenance_notes: [''],
      status: ['pending', Validators.required]
    });
  }

  loadMaintenanceLog(): void {
    this.isLoading = true;
    this.maintenanceService.getMaintenanceLog(this.maintenanceLogId!)
      .subscribe({
        next: (log) => {
          this.maintenanceLog = log;
          this.maintenanceForm.patchValue({
            instrument: log.instrument,
            maintenance_type: log.maintenance_type,
            maintenance_description: log.maintenance_description,
            maintenance_notes: log.maintenance_notes,
            status: log.status
          });
          this.isLoading = false;
        },
        error: (err: any) => {
          this.error = 'Failed to load maintenance log';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  loadMaintenanceTypes(): void {
    this.maintenanceService.getMaintenanceTypes()
      .subscribe({
        next: (types) => {
          this.maintenanceTypes = types;
        },
        error: (err: any) => {
          this.error = 'Failed to load maintenance types';
          console.error(err);
        }
      });
  }

  loadStatusTypes(): void {
    this.maintenanceService.getStatusTypes()
      .subscribe({
        next: (types) => {
          this.statusTypes = types;
        },
        error: (err: any) => {
          this.error = 'Failed to load status types';
          console.error(err);
        }
      });
  }

  save(): void {
    if (this.maintenanceForm.invalid) {
      this.maintenanceForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.maintenanceForm.value;

    if (this.mode === 'create') {
      this.maintenanceService.createMaintenanceLog(formValue)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.activeModal.close('created');
          },
          error: (err: any) => {
            this.error = 'Failed to create maintenance log';
            this.isLoading = false;
            console.error(err);
          }
        });
    } else {
      this.maintenanceService.updateMaintenanceLog(this.maintenanceLogId!, formValue)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.activeModal.close('updated');
          },
          error: (err: any) => {
            this.error = 'Failed to update maintenance log';
            this.isLoading = false;
            console.error(err);
          }
        });
    }
  }

  delete(): void {
    if (confirm('Are you sure you want to delete this maintenance log?')) {
      this.isLoading = true;
      this.maintenanceService.deleteMaintenanceLog(this.maintenanceLogId!)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.activeModal.close('deleted');
          },
          error: (err: any) => {
            this.error = 'Failed to delete maintenance log';
            this.isLoading = false;
            console.error(err);
          }
        });
    }
  }

  switchToEditMode(): void {
    this.mode = 'edit';
    this.maintenanceForm.enable();
  }

  cancel(): void {
    if (this.mode === 'edit' && this.maintenanceLog) {
      // Reset form to original values
      this.maintenanceForm.patchValue({
        instrument: this.maintenanceLog.instrument,
        maintenance_type: this.maintenanceLog.maintenance_type,
        maintenance_description: this.maintenanceLog.maintenance_description,
        maintenance_notes: this.maintenanceLog.maintenance_notes,
        status: this.maintenanceLog.status
      });
      this.mode = 'view';
      this.maintenanceForm.disable();
    } else {
      this.activeModal.dismiss('cancel');
    }
  }

}
