import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MaintenanceLogService} from "../../../maintenance-log.service";
import {MaintenanceLog, MaintenanceLogQuery} from "../../../maintenance-log";
import { MaintenanceLogModalComponent } from '../../../maintenance-log-modal/maintenance-log-modal.component';
import {NgbModal, NgbPagination} from '@ng-bootstrap/ng-bootstrap';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {DatePipe, NgClass} from "@angular/common";
import {Instrument, MaintenanceStatus} from "../../../instrument";
import {WebService} from "../../../web.service";
import {InstrumentService} from "../../../instrument.service";

@Component({
  selector: 'app-instrument-maintenance-logs',
  imports: [
    NgbPagination,
    DatePipe,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './instrument-maintenance-logs.component.html',
  styleUrl: './instrument-maintenance-logs.component.scss'
})
export class InstrumentMaintenanceLogsComponent {
  instrumentId!: number;
  instrumentName: string = '';
  maintenanceStatus: MaintenanceStatus| null = null;
  logs: MaintenanceLogQuery | null = null;
  isLoading = true;
  error: string | null = null;
  currentPage = 1;
  pageSize = 10;
  filterForm: FormGroup;
  statusTypes: Array<{value: string, label: string}> = [];
  maintenanceTypes: Array<{value: string, label: string}> = [];
  instrument: Instrument| null = null;
  constructor(
    private route: ActivatedRoute,
    private maintenanceLogService: MaintenanceLogService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private web: WebService,
    private instrumentService: InstrumentService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      maintenance_type: [''],
      status: [''],
      start_date: [''],
      end_date: ['']
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.instrumentId = +params['instrumentId'];
      this.loadInstrumentDetails();
      this.loadStatusTypes();
      this.loadMaintenanceTypes();
      this.loadLogs();

      this.filterForm.get('search')?.valueChanges
        .pipe(
          debounceTime(400),
          distinctUntilChanged()
        )
        .subscribe(() => this.loadLogs());

      this.filterForm.get('maintenance_type')?.valueChanges.subscribe(() => this.loadLogs());
      this.filterForm.get('status')?.valueChanges.subscribe(() => this.loadLogs());
    });
  }

  loadInstrumentDetails(): void {
    this.isLoading = true;

    // Load instrument details and maintenance status in parallel
    this.instrumentService.getInstrument(this.instrumentId).subscribe((instrument: Instrument) => {
      this.instrument = instrument;
      this.instrumentName = instrument.instrument_name;
    });

    this.instrumentService.getMaintenanceStatus(this.instrumentId).subscribe({
      next: (status) => {
        this.maintenanceStatus = status;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load maintenance status', err);
        this.error = 'Failed to load maintenance status details';
        this.isLoading = false;
      }
    });
  }

  loadStatusTypes(): void {
    this.maintenanceLogService.getStatusTypes().subscribe(types => {
      this.statusTypes = types;
    });
  }

  loadMaintenanceTypes(): void {
    this.maintenanceLogService.getMaintenanceTypes().subscribe(types => {
      this.maintenanceTypes = types;
    });
  }

  loadLogs(): void {
    this.isLoading = true;
    const params = {
      instrument: this.instrumentId,
      page: this.currentPage,
      page_size: this.pageSize,
      search: this.filterForm.get('search')?.value,
      maintenance_type: this.filterForm.get('maintenance_type')?.value,
      status: this.filterForm.get('status')?.value,
      start_date: this.filterForm.get('start_date')?.value,
      end_date: this.filterForm.get('end_date')?.value
    };

    this.maintenanceLogService.getMaintenanceLogs(params).subscribe({
      next: (data) => {
        this.logs = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load maintenance logs';
        this.isLoading = false;
      }
    });
  }

  handlePageChange(page: number): void {
    this.currentPage = page;
    this.loadLogs();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.loadLogs();
  }

  createLog(): void {
    const modalRef = this.modalService.open(MaintenanceLogModalComponent, { size: 'lg' });
    modalRef.componentInstance.instrumentId = this.instrumentId;
    modalRef.componentInstance.mode = 'create';

    modalRef.result.then((result: any) => {
      this.loadLogs();
    }, (reason: any) => {
    });
  }

  viewLog(log: MaintenanceLog): void {
    const modalRef = this.modalService.open(MaintenanceLogModalComponent, { size: 'lg' });
    modalRef.componentInstance.data = log;
    modalRef.componentInstance.instrumentId = this.instrumentId;
    modalRef.componentInstance.mode = 'view';

    modalRef.result.then((result: any) => {
      this.loadLogs();
    }, (reason:any) => {
    });
  }

  getTypeLabel(type: string): string {
    const found = this.maintenanceTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  getStatusLabel(status: string): string {
    const found = this.statusTypes.find(s => s.value === status);
    return found ? found.label : status;
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'completed': return 'bg-success';
      case 'in_progress': return 'bg-warning';
      case 'scheduled': return 'bg-info';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  isWarrantyActive(): boolean {
    if (!this.instrument) {
      return false;
    }
    if (this.instrument.support_information.length === 0) {
      return false;
    }
    if (!this.instrument.support_information[0].warranty_end_date) {
      return false;
    }
    const endDate = new Date(this.instrument.support_information[0].warranty_end_date);
    const today = new Date();

    return endDate >= today;
  }
}
