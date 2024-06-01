import { Component } from '@angular/core';
import {WebService} from "../../web.service";
import {Instrument, InstrumentQuery} from "../../instrument";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {NgbModal, NgbPagination, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {forkJoin, Observable} from "rxjs";
import {DataService} from "../../data.service";
import {NgClass} from "@angular/common";
import {InstrumentBookingModalComponent} from "../instrument-booking-modal/instrument-booking-modal.component";
import {ToastService} from "../../toast.service";
import {BookingTimeVisualizerComponent} from "../booking-time-visualizer/booking-time-visualizer.component";
import {InstrumentService} from "../instrument.service";

@Component({
  selector: 'app-instrument-booking',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgbPagination,
    NgClass,
    NgbTooltip,
    BookingTimeVisualizerComponent
  ],
  templateUrl: './instrument-booking.component.html',
  styleUrl: './instrument-booking.component.scss'
})
export class InstrumentBookingComponent {

  pageSize = 5
  currentInstrumentPage = 1

  instrumentQuery?: InstrumentQuery
  form = this.fb.group({
    searchTerm: ['']
  })

  constructor(private web: WebService, private fb: FormBuilder, public dataService: DataService, private modal: NgbModal, private toastService: ToastService, private instrumentService: InstrumentService) {
    this.web.getInstruments().subscribe((data: any) => {
      this.instrumentQuery = data
      this.getInstrumentPermission()
    })
    this.form.controls.searchTerm.valueChanges.subscribe((value: string| null) => {
      if (value) {
        this.web.getInstruments(undefined, this.pageSize, 0, value).subscribe((data: InstrumentQuery) => {
          this.instrumentQuery = data
          this.getInstrumentPermission()
        })
      }
    })
  }

  clickInstrument(instrument: Instrument) {
    if (this.dataService.instrumentPermissions[instrument.id].can_view||this.dataService.instrumentPermissions[instrument.id].can_book||this.dataService.instrumentPermissions[instrument.id].can_manage) {
      const ref = this.modal.open(InstrumentBookingModalComponent, {scrollable: true})
      ref.componentInstance.selectedInstrument = instrument
      ref.componentInstance.enableSearch = false
      ref.closed.subscribe((data: {instrument: Instrument, selectedRange: {started: Date |undefined, ended: Date | undefined}, usageDescription: string}) => {
        // @ts-ignore
        this.web.createInstrumentUsage(data.instrument.id, data.selectedRange.started, data.selectedRange.ended, data.usageDescription).subscribe((data) => {
          this.instrumentService.updateTrigger.next(true)
          this.toastService.show("Instrument booking", "Successfully booked instrument")
        }, (error) => {
          this.toastService.show("Instrument booking", "Failed to book instrument")
        })
      })
    } else{
      this.toastService.show("Instrument permission", "You do not have permission for this instrument")
    }
  }

  handlePageChange(event: any) {
    if (this.form.controls.searchTerm.value) {
      this.web.getInstruments(undefined, this.pageSize, (event.page - 1) * this.pageSize, this.form.controls.searchTerm.value).subscribe((data: InstrumentQuery) => {
        this.instrumentQuery = data
        this.getInstrumentPermission()
      })
    } else {
      this.web.getInstruments(undefined, this.pageSize, (event.page - 1) * this.pageSize).subscribe((data: InstrumentQuery) => {
        this.instrumentQuery = data
        this.getInstrumentPermission()
      })
    }
  }

  getInstrumentPermission() {
    for (let instrument of this.instrumentQuery!.results) {
      this.web.getInstrumentPermission(instrument.id).subscribe((data) => {
        this.dataService.instrumentPermissions[instrument.id] = data
      }, (error) => {
        this.dataService.instrumentPermissions[instrument.id] = {can_view: false, can_book: false, can_manage: false}
      }, () => {

      })
    }
  }

}
