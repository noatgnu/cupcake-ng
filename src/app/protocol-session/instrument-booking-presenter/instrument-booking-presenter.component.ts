import {AfterViewInit, Component, Input} from '@angular/core';
import {Annotation} from "../../annotation";
import {WebService} from "../../web.service";
import {Instrument, InstrumentUsage} from "../../instrument";
import {DatePipe} from "@angular/common";
import {
  BookingTimeVisualizerComponent
} from "../../instruments/booking-time-visualizer/booking-time-visualizer.component";
import {DataService} from "../../data.service";

@Component({
    selector: 'app-instrument-booking-presenter',
    imports: [
        DatePipe,
        BookingTimeVisualizerComponent
    ],
    templateUrl: './instrument-booking-presenter.component.html',
    styleUrl: './instrument-booking-presenter.component.scss'
})
export class InstrumentBookingPresenterComponent implements AfterViewInit {
  private _annotation?: Annotation

  instrumentUsage: {usage: InstrumentUsage, instrument: Instrument, windowStart: Date|undefined, windowEnd: Date|undefined}[] = []

  @Input() set annotation(value: Annotation) {
    this._annotation = value
    this.instrumentUsage = []
    for (const usage of value.instrument_usage) {
      usage.time_started = new Date(usage.time_started)
      usage.time_ended = new Date(usage.time_ended)
      this.web.getInstrument(usage.instrument).subscribe((data) => {
        let windowStart = new Date(usage.time_started).setHours(0, 0, 0, 0)
        let oneDayBeforeWindowStart = windowStart - 24 * 60 * 60 * 1000
        let windowEnd = new Date(usage.time_ended).setHours(0,0,0,0)
        let oneDayAfterWindowEnd = windowEnd + 24 * 60 * 60 * 1000 *2
        this.instrumentUsage.push({usage: usage, instrument: data, windowStart: new Date(oneDayBeforeWindowStart), windowEnd: new Date(oneDayAfterWindowEnd)})
      })
    }
  }

  get annotation(): Annotation {
    return this._annotation!
  }

  constructor(private web: WebService, private dateService: DataService) {

  }

  ngAfterViewInit() {
    this.dateService.setActiveVisualizer('canvas')
  }

}
