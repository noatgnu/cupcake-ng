import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {Instrument, InstrumentQuery, InstrumentUsage, InstrumentUsageQuery} from "../../instrument";
import {NgbActiveModal, NgbAlert, NgbDateStruct, NgbInputDatepicker, NgbTypeahead} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../web.service";
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {ToastService} from "../../toast.service";
import {BookingTimeVisualizerComponent} from "../booking-time-visualizer/booking-time-visualizer.component";
import {DataService} from "../../data.service";
import {InstrumentService} from "../../instrument.service";
import {DatePipe} from "@angular/common";
import {AccountsService} from "../../accounts/accounts.service";

@Component({
    selector: 'app-instrument-booking-modal',
  imports: [
    ReactiveFormsModule,
    NgbTypeahead,
    BookingTimeVisualizerComponent,
    FormsModule,
    DatePipe,
    NgbAlert,
    NgbInputDatepicker
  ],
    templateUrl: './instrument-booking-modal.component.html',
    styleUrl: './instrument-booking-modal.component.scss'
})
export class InstrumentBookingModalComponent implements OnInit, AfterViewInit {
  instrumentQuery!: InstrumentQuery
  instrumentUsageQuery!: InstrumentUsageQuery

  @Input() selectedInstrument!: Instrument
  @Input() enableSearch: boolean = true
  
  selectedInstrumentUsage: InstrumentUsage | undefined = undefined
  repeat: number = 0
  repeatUntil: NgbDateStruct | undefined = undefined

  searchForm = this.fb.group({
    instrument: [""]
  })

  instrumentForm = this.fb.group({
    name: ["", Validators.required],
    description: ["", Validators.required],
  })

  selectedRange: {started: Date | undefined, ended: Date | undefined, hasMaintenance?: boolean} = {
    started: undefined, 
    ended: undefined
  }

  usageDescription: string = ""
  maintenance: boolean = false
  hasMaintenance: boolean = false
  
  // Loading and error states
  isLoading: boolean = false
  searchLoading: boolean = false
  submitLoading: boolean = false
  errorMessage: string = ""

  // Form validation
  get isFormValid(): boolean {
    return !!(
      this.selectedInstrument &&
      this.selectedRange.started &&
      this.selectedRange.ended &&
      this.usageDescription.trim() &&
      !this.hasMaintenance
    )
  }

  get submitButtonText(): string {
    if (this.submitLoading) return 'Submitting...';
    return this.maintenance ? 'Schedule Maintenance' : 'Submit Booking';
  }

  constructor(private activeModal: NgbActiveModal, private web: WebService, private fb: FormBuilder, private toastService: ToastService, public dataService: DataService, private instrumentService: InstrumentService, public accounts: AccountsService) {


  }

  ngOnInit() {
    this.loadInitialInstruments()
  }

  ngAfterViewInit() {
    this.setupSearchSubscription()
  }

  private loadInitialInstruments(): void {
    this.isLoading = true
    this.errorMessage = ""
    
    this.instrumentService.getInstruments(undefined, 5, 0, undefined, undefined, true).subscribe({
      next: (instrumentQuery) => {
        this.instrumentQuery = instrumentQuery
        this.getInstrumentPermission()
        this.isLoading = false
      },
      error: (error) => {
        this.errorMessage = "Failed to load instruments. Please try again."
        this.isLoading = false
        this.toastService.show("Error", "Failed to load instruments")
      }
    })
  }

  private setupSearchSubscription(): void {
    this.searchForm.controls.instrument.valueChanges.subscribe(value => {
      if (value && value.trim()) {
        this.searchInstruments(value.trim())
      } else if (!value) {
        this.loadInitialInstruments()
      }
    })
  }

  private searchInstruments(searchTerm: string): void {
    this.searchLoading = true
    this.errorMessage = ""
    
    this.instrumentService.getInstruments(undefined, 5, 0, searchTerm, undefined, true).subscribe({
      next: (instrumentQuery) => {
        this.instrumentQuery = instrumentQuery
        this.getInstrumentPermission()
        this.searchLoading = false
      },
      error: (error) => {
        this.errorMessage = "Search failed. Please try again."
        this.searchLoading = false
        this.toastService.show("Search Error", "Failed to search instruments")
      }
    })
  }

  getInstruments(url: string): void {
    this.isLoading = true
    this.errorMessage = ""
    
    this.instrumentService.getInstruments(url).subscribe({
      next: (instrumentQuery) => {
        this.instrumentQuery = instrumentQuery
        this.getInstrumentPermission()
        this.isLoading = false
      },
      error: (error) => {
        this.errorMessage = "Failed to load instruments. Please try again."
        this.isLoading = false
        this.toastService.show("Error", "Failed to load instruments")
      }
    })
  }

  createInstrument() {
    if (this.instrumentForm.invalid) {
      return
    }
    // @ts-ignore
    this.instrumentService.createInstrument(this.instrumentForm.value.name, this.instrumentForm.value.description).subscribe((instrument) => {
      this.toastService.show("Instrument created", instrument.instrument_name)
    })
  }

  clickInstrument(instrument: Instrument): void {
    this.errorMessage = ""
    
    if (!this.dataService.instrumentPermissions[instrument.id]?.can_book) {
      this.toastService.show("Access Denied", "You do not have permission to book this instrument")
      return
    }

    this.isLoading = true
    this.web.getInstrumentUsage(instrument.id, undefined, undefined, undefined, 100).subscribe({
      next: (instrumentUsageQuery) => {
        this.instrumentUsageQuery = instrumentUsageQuery
        this.selectedInstrument = instrument
        this.isLoading = false
        // Reset form state when selecting new instrument
        this.resetBookingForm()
      },
      error: (error) => {
        this.errorMessage = "Failed to load instrument booking data."
        this.isLoading = false
        this.toastService.show("Error", "Failed to load instrument booking information")
      }
    })
  }

  handleSelectedRange(range: {started: Date, ended: Date, hasMaintenance: boolean}): void {
    this.selectedRange = range
    this.hasMaintenance = range.hasMaintenance
    this.errorMessage = ""
    
    // Validate the selected range
    if (range.started && range.ended && range.started >= range.ended) {
      this.errorMessage = "End time must be after start time."
      this.hasMaintenance = true
    }
  }

  submit(): void {
    if (!this.isFormValid) {
      this.errorMessage = "Please fill in all required fields and select a valid time range."
      return
    }

    this.submitLoading = true
    this.errorMessage = ""

    try {
      this.activeModal.close({
        instrument: this.selectedInstrument,
        selectedRange: this.selectedRange,
        usageDescription: this.usageDescription.trim(),
        maintenance: this.maintenance,
        repeat: this.repeat,
        repeatUntil: this.repeatUntil,
      })
    } catch (error) {
      this.submitLoading = false
      this.errorMessage = "Failed to submit booking request."
      this.toastService.show("Error", "Failed to submit booking")
    }
  }

  cancel(): void {
    this.activeModal.dismiss()
  }

  private resetBookingForm(): void {
    this.selectedRange = { started: undefined, ended: undefined }
    this.usageDescription = ""
    this.maintenance = false
    this.hasMaintenance = false
    this.repeat = 0
    this.repeatUntil = undefined
    this.selectedInstrumentUsage = undefined
    this.errorMessage = ""
  }

  getInstrumentPermission() {
    for (const instrument of this.instrumentQuery.results) {
      this.instrumentService.getInstrumentPermission(instrument.id).subscribe((data:any) => {
        this.dataService.instrumentPermissions[instrument.id] = data
      }, (error:any) => {
        this.dataService.instrumentPermissions[instrument.id] = {can_view: false, can_book: false, can_manage: false}
      })
    }
  }

  handleSelectedInstrumentUsage(instrumentUsage: InstrumentUsage) {
    this.selectedInstrumentUsage = instrumentUsage
  }

  deleteUsage(instrumentUsage: InstrumentUsage) {
    this.web.deleteInstrumentUsage(instrumentUsage.id).subscribe(() => {
      this.toastService.show("Instrument usage", "Successfully deleted instrument usage")
      this.instrumentService.updateTrigger.next(true)
      this.selectedInstrumentUsage = undefined
    }, error => {
      this.toastService.show("Instrument usage", "Failed to delete instrument usage")
    })
  }

}
