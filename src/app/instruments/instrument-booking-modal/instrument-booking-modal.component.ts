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
export class InstrumentBookingModalComponent implements OnInit, AfterViewInit{

  instrumentQuery!: InstrumentQuery

  instrumentUsageQuery!: InstrumentUsageQuery

  @Input() selectedInstrument!: Instrument
  @Input() enableSearch: boolean = true
  selectedInstrumentUsage!: InstrumentUsage|undefined
  repeat: number = 0
  repeatUntil: NgbDateStruct|undefined = undefined

  searchForm = this.fb.group({
    instrument: [""]
  })

  instrumentForm = this.fb.group({
    name: ["", Validators.required],
    description: ["", Validators.required],
  })

  selectedRange: {started: Date|undefined, ended: Date|undefined} = {started: undefined, ended: undefined}

  usageDescription: string = ""
  maintenance: boolean = false
  hasMaintenance: boolean = false

  constructor(private activeModal: NgbActiveModal, private web: WebService, private fb: FormBuilder, private toastService: ToastService, public dataService: DataService, private instrumentService: InstrumentService, public accounts: AccountsService) {


  }

  ngOnInit() {
    this.instrumentService.getInstruments(undefined, 5, 0, undefined, undefined, true).subscribe(instrumentQuery => {
      this.instrumentQuery = instrumentQuery
      this.getInstrumentPermission()
    })
  }

  ngAfterViewInit() {
    this.searchForm.controls.instrument.valueChanges.subscribe(value => {
      if (value) {
        this.instrumentService.getInstruments(undefined, 5, 0, value, undefined, true).subscribe(instrumentQuery => {
          this.instrumentQuery = instrumentQuery
          this.getInstrumentPermission()
        })
      }
    })
  }

  getInstruments(url: string) {
    this.instrumentService.getInstruments(url).subscribe(instrumentQuery => {
      this.instrumentQuery = instrumentQuery
      this.getInstrumentPermission()
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

  clickInstrument(instrument: Instrument) {
    if (this.dataService.instrumentPermissions[instrument.id].can_book) {
      this.web.getInstrumentUsage(instrument.id, undefined, undefined, undefined, 100).subscribe(instrumentUsageQuery => {
        this.instrumentUsageQuery = instrumentUsageQuery
        this.selectedInstrument = instrument
      })
    } else {
      this.toastService.show("Instrument permission", "You do not have permission to book this instrument")
    }

  }

  handleSelectedRange(range: {started: Date, ended: Date, hasMaintenance: boolean}) {
    this.selectedRange = range
    this.hasMaintenance = range.hasMaintenance
    console.log(this.selectedRange)
  }


  submit() {
    this.activeModal.close({
      instrument: this.selectedInstrument,
      selectedRange: this.selectedRange,
      usageDescription: this.usageDescription,
      maintenance: this.maintenance,
      repeat: this.repeat,
      repeatUntil: this.repeatUntil,
    })
  }

  cancel() {
    this.activeModal.dismiss()
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
