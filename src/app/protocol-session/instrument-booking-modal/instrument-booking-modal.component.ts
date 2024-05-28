import {Component, OnInit} from '@angular/core';
import {Instrument, InstrumentQuery, InstrumentUsageQuery} from "../../instrument";
import {NgbActiveModal, NgbTypeahead} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../web.service";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {ToastService} from "../../toast.service";
import {BookingTimeVisualizerComponent} from "./booking-time-visualizer/booking-time-visualizer.component";

@Component({
  selector: 'app-instrument-booking-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgbTypeahead,
    BookingTimeVisualizerComponent
  ],
  templateUrl: './instrument-booking-modal.component.html',
  styleUrl: './instrument-booking-modal.component.scss'
})
export class InstrumentBookingModalComponent implements OnInit{

  instrumentQuery!: InstrumentQuery

  instrumentUsageQuery!: InstrumentUsageQuery

  selectedInstrument!: Instrument

  searchForm = this.fb.group({
    instrument: [""]
  })

  instrumentForm = this.fb.group({
    name: ["", Validators.required],
    description: ["", Validators.required],
  })


  constructor(private activeModal: NgbActiveModal, private web: WebService, private fb: FormBuilder, private toastService: ToastService) {
    this.searchForm.controls.instrument.valueChanges.subscribe(value => {
      console.log(value)
      if (value) {
        this.web.getInstruments(undefined, 5, 0, value).subscribe(instrumentQuery => this.instrumentQuery = instrumentQuery)
      }
    })

  }

  ngOnInit() {
    this.web.getInstruments().subscribe(instrumentQuery => this.instrumentQuery = instrumentQuery)
  }

  getInstruments(url: string) {
    this.web.getInstruments(url).subscribe(instrumentQuery => this.instrumentQuery = instrumentQuery)
  }

  createInstrument() {
    if (this.instrumentForm.invalid) {
      return
    }
    // @ts-ignore
    this.web.createInstrument(this.instrumentForm.value.name, this.instrumentForm.value.description).subscribe((instrument) => {
      this.toastService.show("Instrument created", instrument.instrument_name)
    })
  }

  clickInstrument(instrument: Instrument) {
    this.web.getInstrumentUsage(instrument.id).subscribe(instrumentUsageQuery => {
      this.instrumentUsageQuery = instrumentUsageQuery
      this.selectedInstrument = instrument
    })
  }

  close() {
    this.activeModal.close()
  }

}
