import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {Instrument, InstrumentUsageQuery} from "../../instrument";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {NgbCalendar, NgbDate, NgbDatepicker, NgbTimepicker} from "@ng-bootstrap/ng-bootstrap";
import {DatePipe} from "@angular/common";
import {WebService} from "../../web.service";
import {ToastService} from "../../toast.service";

@Component({
  selector: 'app-booking-time-visualizer',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgbDatepicker,
    NgbTimepicker,
    DatePipe
  ],
  templateUrl: './booking-time-visualizer.component.html',
  styleUrl: './booking-time-visualizer.component.scss'
})
export class BookingTimeVisualizerComponent implements AfterViewInit{
  @Input() instrument!: Instrument;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  ctx!: CanvasRenderingContext2D;
  dragStart!: number|undefined;
  selectedStart!: number|undefined;
  dragEnd!: number|undefined;
  selectedEnd!: number|undefined;
  padding = 0
  current = new Date().setHours(0, 0, 0, 0)
  timeBlocks: Date[] = []

  private _dateBeforeCurrent = new Date(this.current - 24 * 60 * 60 * 1000)

  @Input() set dateBeforeCurrent(value: Date) {
    this._dateBeforeCurrent = value
    this.form.controls.windowStart.setValue(value)
  }

  get dateBeforeCurrent(): Date {
    return this._dateBeforeCurrent
  }

  private _dateAfterCurrent = new Date(this.current + 48 * 60 * 60 * 1000)

  @Input() set dateAfterCurrent(value: Date) {
    this._dateAfterCurrent = value
    this.form.controls.windowEnd.setValue(value)
  }

  get dateAfterCurrent(): Date {
    return this._dateAfterCurrent
  }

  form = this.fb.group({
    windowStart: [this.dateBeforeCurrent],
    windowEnd: [this.dateAfterCurrent]
  })
  @Input() selectedTimeRange: {start: Date|null, end: Date|null} = {start: null, end: null}
  blockSize = 10
  width = 0
  height = 125
  selected = false
  instrumentUsageQuery?: InstrumentUsageQuery

  hoveredDate: NgbDate | null = null;
  fromDate: NgbDate = new NgbDate(this.dateBeforeCurrent.getFullYear(), this.dateBeforeCurrent.getMonth() + 1, this.dateBeforeCurrent.getDate());
  toDate: NgbDate | null = new NgbDate(this.dateAfterCurrent.getFullYear(), this.dateAfterCurrent.getMonth() + 1, this.dateAfterCurrent.getDate());
  @Input() enableEdit = true;
  @Input() selectedStartDate!: Date|undefined;
  @Input() selectedEndDate!: Date|undefined;

  @Output() selectedRangeOut: EventEmitter<{ started: Date, ended: Date}> = new EventEmitter<{ started: Date, ended: Date}>();

  constructor(private fb: FormBuilder, private toastService: ToastService, private web: WebService, private calendar: NgbCalendar) {

  }

  ngAfterViewInit() {
    const ctx = this.canvas.nativeElement.getContext('2d')

    if (this.instrument) {
      // @ts-ignore
      this.web.getInstrumentUsage(this.instrument.id, this.form.value.windowStart, this.form.value.windowEnd).subscribe((data) => {
        this.instrumentUsageQuery = data
        if (ctx) {
          this.ctx = ctx
          // draw time blocks from the start of the day before the current time to the end of the day after the current time
          this.prepare().then();
        }
      })
    }



  }

  private async prepare() {
    this.clearCanvas()
    const timeBlocks: Date[] = []
    const windowStart = this.form.value.windowStart
    const windowEnd = this.form.value.windowEnd
    if (windowStart && windowEnd) {
      let current = windowStart
      while (current <= windowEnd) {
        timeBlocks.push(new Date(current))
        current = new Date(current.getTime() + 60 * 60 * 1000)
      }
      let currentMarker = new Date()
      this.timeBlocks = timeBlocks
      console.log(timeBlocks)
      this.width = this.blockSize * timeBlocks.length
      let dpi = window.devicePixelRatio
      this.canvas.nativeElement.width = this.width
      let style_height = +getComputedStyle(this.canvas.nativeElement).getPropertyValue("height").slice(0, -2);
      let style_width = +getComputedStyle(this.canvas.nativeElement).getPropertyValue("width").slice(0, -2);
      this.canvas.nativeElement.setAttribute('height', (style_height * dpi).toString());
      this.canvas.nativeElement.setAttribute('width', (style_width * dpi).toString());
      this.width = style_width * dpi
      console.log(this.width)
      const delta = windowEnd.getTime() - windowStart.getTime()
      // draw the time blocks above which include day before and day after the current day
      this.drawBackground(this.timeBlocks, this.width, currentMarker, delta);
    }
  }

  private drawBackground(timeBlocks: Date[], graphWidth: number, currentMarker: Date, windowTimeRange: number) {
    this.ctx.fillStyle = 'gray'
    let currrentDrawDate = 0
    let uniqueDateFromTimeBlocks = timeBlocks.filter(time => {
      if (time.getDate() !== currrentDrawDate) {
        currrentDrawDate = time.getDate()
        return true
      }
      return false
    })
    const totalDrawingBlock = timeBlocks.length
    let currentStart = this.padding

    const graphPixelOverTime = graphWidth/windowTimeRange
    uniqueDateFromTimeBlocks.forEach((time, index) => {
      this.ctx.textBaseline = 'top'
      this.ctx.fillStyle = 'gray'
      const filteredTimeBlocks = timeBlocks.filter(timeBlock => timeBlock.getDate() === time.getDate())
      console.log(time)
      const xStart = currentStart
      const xEnd = xStart + (filteredTimeBlocks.length) * this.blockSize
      this.ctx.fillRect(xStart, 0, filteredTimeBlocks.length * this.blockSize, this.height)
      this.ctx.fillStyle = 'white'
      this.ctx.fillText(time.toLocaleDateString(), xStart + 50, 10)
      console.log(xStart, xEnd, filteredTimeBlocks.length, this.blockSize, this.height)
      // add marker for each day
      this.ctx.beginPath()
      this.ctx.setLineDash([])
      // @ts-ignore
      const pixelStart = (time.getTime() - this.form.value.windowStart.getTime()) * graphPixelOverTime
      this.ctx.moveTo(pixelStart, 0)
      this.ctx.lineTo(pixelStart, this.height)
      this.ctx.stroke()
      this.ctx.closePath()

      // draw time marker for each day in 24hr format
      filteredTimeBlocks.forEach(timeBlock => {
        const hour = timeBlock.getHours()
        // @ts-ignore
        const timeBlockPixelStart = (timeBlock.getTime() - this.form.value.windowStart.getTime()) * graphPixelOverTime

        // draw block every two hours
        if (hour % 2 === 0) {
          this.ctx.fillStyle = 'white'
          this.ctx.textBaseline = 'bottom'
          //const x = (timeBlock.getHours() / 24) * (filteredTimeBlocks.length) * blockSize + xStart
          this.ctx.save()
          this.ctx.translate(timeBlockPixelStart, this.height)
          this.ctx.rotate(-Math.PI / 2)
          this.ctx.fillText(timeBlock.toLocaleTimeString(), 50, this.blockSize)
          this.ctx.restore()
        }

        // draw dashed line for each hour
        this.ctx.beginPath()
        //const x = (timeBlock.getHours() / 24) * (filteredTimeBlocks.length) * blockSize + xStart
        this.ctx.setLineDash([5, 15])
        this.ctx.moveTo(timeBlockPixelStart, 0)
        this.ctx.lineTo(timeBlockPixelStart, 2)
        this.ctx.stroke()
        this.ctx.closePath()
      })
      currentStart = xEnd

    })
    // draw other instrument usages from the instrumentUsageQuery

    for (const usage of this.instrumentUsageQuery!.results) {
      usage.time_started = new Date(usage.time_started)
      usage.time_ended = new Date(usage.time_ended)
      if ((usage.time_started && usage.time_ended) && (usage.time_started.getTime() !== this.selectedTimeRange.start?.getTime() && usage.time_ended.getTime() !== this.selectedTimeRange.end?.getTime())) {
        const start = new Date(usage.time_started)
        const end = new Date(usage.time_ended)
        const delta = end.getTime() - start.getTime()
        const deltaPixel = delta * graphPixelOverTime
        // @ts-ignore
        const deltaStart = start.getTime() - this.form.value.windowStart.getTime()
        const deltaStartPixel = this.padding + deltaStart * graphPixelOverTime
        this.ctx.fillStyle = 'rgba(146,9,207,0.26)'
        this.ctx.fillRect(this.padding + deltaStartPixel, 0, deltaPixel, this.height)
      }
    }

    //draw selected time range accurate to seconds
    if (this.selectedTimeRange.start && this.selectedTimeRange.end) {
      const start = this.selectedTimeRange.start
      const end = this.selectedTimeRange.end
      console.log(start, end)
      const delta = end.getTime() - start.getTime()
      const deltaPixel = delta * graphPixelOverTime
      // @ts-ignore
      const deltaStart = start.getTime() - this.form.value.windowStart.getTime()
      const deltaStartPixel = this.padding + deltaStart * graphPixelOverTime
      this.ctx.fillStyle = 'rgba(176,216,0,0.26)'
      this.ctx.fillRect(this.padding + deltaStartPixel, 0, deltaPixel, this.height)
    }
    //draw current marker
    this.ctx.fillStyle = 'red'
    // get delta from before current date to current date
    // @ts-ignore
    const deltaTime = currentMarker.getTime() - this.form.value.windowStart.getTime()
    const x = this.padding + deltaTime * graphPixelOverTime
    this.ctx.fillRect(x, 0, 2, this.height)
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height)
  }

  draw() {

    this.clearCanvas()
    const windowStart = this.form.value.windowStart
    const windowEnd = this.form.value.windowEnd
    if (windowStart && windowEnd) {
      const delta = windowEnd.getTime() - windowStart.getTime()
      this.drawBackground(this.timeBlocks, this.width - this.padding * 2, new Date(), delta)
      // draw selected time range as a block on the canvas with a different highly transparent color
      if (this.dragStart && this.dragEnd) {
        const start = this.dragStart
        const end = this.dragEnd
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
        this.ctx.fillRect(start, 0, end - start, this.height)
      }
    }


  }

  onMouseDown(event: MouseEvent) {
    if (!this.enableEdit) {
      return
    }
    const positionInTime = this.convertPixelToTime(event.offsetX)

    // check if the position is within an existing instrumentUsage block
    for (const usage of this.instrumentUsageQuery!.results) {
      if (positionInTime.getTime() >= usage.time_started.getTime() && positionInTime.getTime() <= usage.time_ended.getTime()) {
        this.toastService.show("This time is already booked", "Please select another time")
        return
      }
    }


    if (!this.selected) {
      this.dragStart = event.offsetX
      this.selectedStart = event.offsetX
      this.selectedStartDate = positionInTime
    }
  }

  onMouseUp(event: MouseEvent) {
    if (!this.enableEdit) {
      return
    }
    this.dragEnd = event.offsetX
    let positionInTime = this.convertPixelToTime(event.offsetX)
    if (!this.selected) {
      for (const usage of this.instrumentUsageQuery!.results) {
        if (positionInTime.getTime() >= usage.time_started.getTime() && positionInTime.getTime() <= usage.time_ended.getTime()) {
          return
        }
      }
      this.selected = true


    } else {
      let startPosition = this.convertPixelToTime(this.selectedStart!)
      // switch positionInTime and startPosition if positionInTime is less than startPosition
      if (positionInTime.getTime() < startPosition.getTime()) {
        const temp = new Date(positionInTime)
        positionInTime = startPosition
        startPosition = temp
      }
      // check if another usage is within the selected range
      for (const usage of this.instrumentUsageQuery!.results) {
        if (usage.time_started && usage.time_ended) {
          if ((usage.time_started.getTime() >= startPosition.getTime() && usage.time_started.getTime() <= positionInTime.getTime()) ||
            (usage.time_ended.getTime() >= startPosition.getTime() && usage.time_ended.getTime() <= positionInTime.getTime())) {
            this.toastService.show("There are another usage block within the selection range", "Please select another time")
            return
          }
        }
      }

      this.selectedEnd = event.offsetX

      if (this.dragStart && this.dragEnd) {
        // @ts-ignore
        if (this.selectedStart > this.selectedEnd) {
          // @ts-ignore
          const temp = this.selectedStart+0
          this.selectedStart = this.selectedEnd
          this.selectedEnd = temp
        }
        this.convertDragStartAndEndToExactTimeRange()
        this.selectedEnd = undefined
        this.selectedStart = undefined
        this.dragStart = undefined
        this.dragEnd = undefined
        //this.selectedEndDate = undefined
        //this.selectedStartDate = undefined
        this.selected = false

        this.selectedRangeOut.emit({started: this.selectedTimeRange.start!, ended: this.selectedTimeRange.end!})
      }
    }
  }

  onMouseMove(event: MouseEvent) {
    if (!this.enableEdit) {
      return
    }
    if (this.dragStart) {
      this.dragEnd = event.offsetX
      this.selectedEndDate = this.convertPixelToTime(this.dragEnd)
      this.draw()
    } else {
      this.selectedStartDate = this.convertPixelToTime(event.offsetX)
    }
  }

  convertDragStartAndEndToExactTimeRange() {
    // convert selected pixel range to exact time range
    if (this.selectedStart && this.selectedEnd) {
      const start = this.selectedStart
      const end = this.selectedEnd
      // convert window time range from form to exact seconds

      const windowStart = this.form.value.windowStart
      const windowEnd = this.form.value.windowEnd
      if (windowStart && windowEnd) {
        const delta = windowEnd.getTime() - windowStart.getTime()
        const canvasWidth = this.width - this.padding * 2
        const deltaSeconds = delta / 1000
        const deltaPixels = canvasWidth / deltaSeconds
        const startSeconds = (start - this.padding) / deltaPixels
        const endSeconds = (end - this.padding) / deltaPixels
        // convert start seconds to exact time using window start
        const startExact = new Date(windowStart.getTime() + startSeconds * 1000)
        const endExact = new Date(windowStart.getTime() + endSeconds * 1000)
        this.selectedTimeRange = {start: startExact, end: endExact}
        this.drawBackground(this.timeBlocks, canvasWidth, new Date(), delta)
      }
    }
  }

  convertPixelToTime(pixel: number) {
    const windowStart = this.form.value.windowStart
    const windowEnd = this.form.value.windowEnd
    if (windowStart && windowEnd) {
      const delta = windowEnd.getTime() - windowStart.getTime()
      const canvasWidth = this.width - this.padding * 2
      const deltaSeconds = delta / 1000
      const deltaPixels = canvasWidth / deltaSeconds
      const startSeconds = (pixel - this.padding) / deltaPixels
      return new Date(windowStart.getTime() + startSeconds * 1000)
    }
    return new Date()
  }

  onDateSelection(date: NgbDate) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
    } else {
      this.toDate = null;
      this.fromDate = date;
    }
  }

  isHovered(date: NgbDate) {
    return (
      this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate)
    );
  }

  isInside(date: NgbDate) {
    return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }

  isRange(date: NgbDate) {
    return (
      date.equals(this.fromDate) ||
      (this.toDate && date.equals(this.toDate)) ||
      this.isInside(date) ||
      this.isHovered(date)
    );
  }

  updateTimeWindow() {
    // update the time window to the selected date range
    if (this.fromDate && this.toDate) {
      const start = new Date(this.fromDate.year, this.fromDate.month - 1, this.fromDate.day)
      const end = new Date(this.toDate.year, this.toDate.month - 1, this.toDate.day)
      // set end date to the end of the day

      this.form.controls.windowStart.setValue(start)
      this.form.controls.windowEnd.setValue(new Date(end.setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000 *2))
      this.prepare().then()
    }

  }
}
