import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {Instrument} from "../../../instrument";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {NgbCalendar, NgbDate, NgbDatepicker, NgbTimepicker} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-booking-time-visualizer',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgbDatepicker,
    NgbTimepicker
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
  dateBeforeCurrent = new Date(this.current - 24 * 60 * 60 * 1000)
  dateAfterCurrent = new Date(this.current + 24 * 60 * 60 * 1000)
  form = this.fb.group({
    windowStart: [this.dateBeforeCurrent],
    windowEnd: [this.dateAfterCurrent]
  })
  selectedTimeRange: {start: Date|null, end: Date|null} = {start: null, end: null}
  blockSize = 10
  width = 0
  height = 125
  selected = false

  hoveredDate: NgbDate | null = null;
  fromDate: NgbDate = new NgbDate(this.dateBeforeCurrent.getFullYear(), this.dateBeforeCurrent.getMonth() + 1, this.dateBeforeCurrent.getDate());
  toDate: NgbDate | null = new NgbDate(this.dateAfterCurrent.getFullYear(), this.dateAfterCurrent.getMonth() + 1, this.dateAfterCurrent.getDate());

  constructor(private fb: FormBuilder, private calendar: NgbCalendar) {

  }

  ngAfterViewInit() {
    if (this.instrument) {

    }
    const ctx = this.canvas.nativeElement.getContext('2d')

    if (ctx) {
      this.ctx = ctx
      // draw time blocks from the start of the day before the current time to the end of the day after the current time
      this.prepare();
    }
  }

  private prepare() {
    this.clearCanvas()
    const timeBlocks: Date[] = []
    const windowStart = this.form.value.windowStart
    const windowEnd = this.form.value.windowEnd
    if (windowStart && windowEnd) {
      let current = windowStart
      while (current <= windowEnd) {
        timeBlocks.push(new Date(current))
        current = new Date(current.getTime() + 60 * 60 * 1000)
        console.log(current.getTime())
      }
      let currentMarker = new Date()
      this.timeBlocks = timeBlocks

      this.width = this.blockSize * timeBlocks.length
      this.canvas.nativeElement.width = this.width
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
    const blockSize = graphWidth / totalDrawingBlock
    const graphPixelOverTime = graphWidth/windowTimeRange
    uniqueDateFromTimeBlocks.forEach((time, index) => {
      this.ctx.textBaseline = 'top'
      this.ctx.fillStyle = 'gray'
      const filteredTimeBlocks = timeBlocks.filter(timeBlock => timeBlock.getDate() === time.getDate())
      const xStart = currentStart
      const xEnd = xStart + (filteredTimeBlocks.length) * blockSize
      this.ctx.fillRect(xStart, 0, filteredTimeBlocks.length * blockSize, this.height)
      this.ctx.fillStyle = 'white'
      this.ctx.fillText(time.toLocaleDateString(), xStart + 50, 10)
      // add marker for each day
      this.ctx.beginPath()
      this.ctx.setLineDash([])
      this.ctx.moveTo(xStart, 0)
      this.ctx.lineTo(xStart, this.height)
      this.ctx.stroke()
      this.ctx.closePath()

      // draw time marker for each day in 24hr format
      filteredTimeBlocks.forEach(timeBlock => {
        const hour = timeBlock.getHours()
        // draw block every two hours
        if (hour % 2 === 0) {
          this.ctx.fillStyle = 'white'
          this.ctx.textBaseline = 'bottom'
          const x = (timeBlock.getHours() / 24) * (filteredTimeBlocks.length) * blockSize + xStart
          this.ctx.save()
          this.ctx.translate(x, this.height)
          this.ctx.rotate(-Math.PI / 2)
          this.ctx.fillText(timeBlock.toLocaleTimeString(), 50, blockSize)
          this.ctx.restore()
          console.log(timeBlock)
          console.log(timeBlock.getTime())
          console.log(x)
        }

        // draw dashed line for each hour
        this.ctx.beginPath()
        const x = (timeBlock.getHours() / 24) * (filteredTimeBlocks.length) * blockSize + xStart
        this.ctx.setLineDash([5, 15])
        this.ctx.moveTo(x, 0)
        this.ctx.lineTo(x, 2)
        this.ctx.stroke()
        this.ctx.closePath()
      })
      currentStart = xEnd
    })

    //draw selected time range accurate to seconds
    if (this.selectedTimeRange.start && this.selectedTimeRange.end) {
      const start = this.selectedTimeRange.start
      const end = this.selectedTimeRange.end
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
    console.log(currentMarker)
    console.log(currentMarker.getTime())
    console.log(deltaTime)
    const x = this.padding + deltaTime * graphPixelOverTime-this.blockSize
    console.log(x)
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

    if (!this.selected) {
      this.dragStart = event.offsetX
      this.selectedStart = event.offsetX
    }
  }

  onMouseUp(event: MouseEvent) {
    this.dragEnd = event.offsetX
    if (!this.selected) {
      this.selected = true

    } else {
      this.selectedEnd = event.offsetX
      if (this.dragStart && this.dragEnd) {
        this.convertDragStartAndEndToExactTimeRange()
        this.selectedEnd = undefined
        this.selectedStart = undefined
        this.dragStart = undefined
        this.dragEnd = undefined
        this.selected = false
      }
    }
  }

  onMouseMove(event: MouseEvent) {
    if (this.dragStart) {
      this.dragEnd = event.offsetX
      this.draw()
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
      this.form.controls.windowStart.setValue(start)
      this.form.controls.windowEnd.setValue(end)
      this.prepare()
    }

  }
}
