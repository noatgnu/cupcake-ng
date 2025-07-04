import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input, OnChanges, OnDestroy, OnInit,
  Output, SimpleChanges,
  ViewChild, HostListener
} from '@angular/core';
import {Instrument, InstrumentUsage, InstrumentUsageQuery} from "../../instrument";
import {FormBuilder, ReactiveFormsModule, FormsModule} from "@angular/forms";
import {
  NgbCalendar,
  NgbDate,
  NgbDatepicker,
  NgbDatepickerNavigateEvent,
  NgbDateStruct,
  NgbDropdown, NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLinkButton,
  NgbNavOutlet,
  NgbTimepicker,
  NgbTooltip
} from "@ng-bootstrap/ng-bootstrap";
import {DatePipe} from "@angular/common";
import {WebService} from "../../web.service";
import {ToastService} from "../../toast.service";
import {DataService} from "../../data.service";
import {AccountsService} from "../../accounts/accounts.service";
import {InstrumentService} from "../../instrument.service";

@Component({
    selector: 'app-booking-time-visualizer',
  imports: [
    ReactiveFormsModule,
    NgbDatepicker,
    NgbTimepicker,
    DatePipe,
    NgbTooltip,
    NgbNav,
    NgbNavContent,
    NgbNavLinkButton,
    NgbNavItem,
    NgbNavOutlet,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    FormsModule
  ],
    templateUrl: './booking-time-visualizer.component.html',
    styleUrl: './booking-time-visualizer.component.scss'
})
export class BookingTimeVisualizerComponent implements OnInit, AfterViewInit,  AfterViewChecked, OnDestroy {
  @Input() instrument!: Instrument;
  @ViewChild('canvasEdit') canvasEdit!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasNonEdit') canvasNonEdit!: ElementRef<HTMLCanvasElement>;
  activeTab = "existingBookings"
  ctx!: CanvasRenderingContext2D;
  dragStart!: number|undefined;
  selectedStart!: number|undefined;
  dragEnd!: number|undefined;
  selectedEnd!: number|undefined;
  padding = 0
  current = new Date().setHours(0, 0, 0, 0)
  timeBlocks: Date[] = []
  requiredApprovalMaxDaysAhead = false
  requiredApprovalMaxDaysDuration = false
  startTime: { hour: number, minute: number } = { hour: 0, minute: 0 };
  endTime: { hour: number, minute: number } = { hour: 0, minute: 0 };
  showStartTimepicker = true;
  showEndTimepicker = true;
  previewStartDate: Date | null = null;
  previewEndDate: Date | null = null;
  @ViewChild('dp') dp!: NgbDatepicker

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
  blockSize = 20
  width = 0
  height = 125
  selected = false
  instrumentUsageQuery?: InstrumentUsageQuery

  calendarUsageQuery?: InstrumentUsageQuery
  hoveredDate: NgbDate | null = null;
  fromDate: NgbDate = new NgbDate(this.dateBeforeCurrent.getFullYear(), this.dateBeforeCurrent.getMonth() + 1, this.dateBeforeCurrent.getDate());
  toDate: NgbDate | null = new NgbDate(this.dateAfterCurrent.getFullYear(), this.dateAfterCurrent.getMonth() + 1, this.dateAfterCurrent.getDate());
  @Input() enableEdit = false;
  @Input() selectedStartDate!: Date|undefined;
  @Input() selectedEndDate!: Date|undefined;
  @Input() enableDelete: boolean = false;
  @Output() selectedRangeOut: EventEmitter<{ started: Date, ended: Date, hasMaintenance: boolean}> = new EventEmitter<{ started: Date, ended: Date, hasMaintenance: boolean}>();
  @Output() selectedUsageBlock: EventEmitter<InstrumentUsage> = new EventEmitter<InstrumentUsage>();
  constructor(private cdr: ChangeDetectorRef, private fb: FormBuilder, private toastService: ToastService, private web: WebService, public dataService: DataService, public accounts: AccountsService, private instrumentService: InstrumentService) {
    this.instrumentService.updateTrigger.asObservable().subscribe(() => {
      if (this.instrument) {
        // @ts-ignore
        this.web.getInstrumentUsage(this.instrument.id, this.form.value.windowStart, this.form.value.windowEnd).subscribe((data) => {
          this.instrumentUsageQuery = data
          if (this.enableEdit) {
            this.prepare(this.canvasEdit).then();
          } else {
            this.prepare(this.canvasNonEdit).then();
          }

        })
      }
    })
  }
  private lastMoveTime: number | undefined;
  private animationFrameId: number | undefined;
  private renderCache: Map<string, ImageData> = new Map();
  private isHighDPI = window.devicePixelRatio > 1;
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    event.preventDefault();
    const touch = event.touches[0];
    const element = this.enableEdit ? this.canvasEdit.nativeElement : this.canvasNonEdit.nativeElement;
    const rect = element.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;

    // Create a more complete synthetic mouse event
    const mouseEvent = {
      offsetX,
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => {},
      stopPropagation: () => {}
    } as MouseEvent;

    this.onMouseDown(mouseEvent);
  }
  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    event.preventDefault();
    const touch = event.touches[0];
    const element = this.enableEdit ? this.canvasEdit.nativeElement : this.canvasNonEdit.nativeElement;
    const rect = element.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;

    const mouseEvent = {
      offsetX,
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => {},
      stopPropagation: () => {}
    } as MouseEvent;

    this.onMouseMove(mouseEvent);
  }
  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    event.preventDefault();
    const touch = event.changedTouches[0];
    const element = this.enableEdit ? this.canvasEdit.nativeElement : this.canvasNonEdit.nativeElement;
    const rect = element.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;

    const mouseEvent = {
      offsetX,
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => {},
      stopPropagation: () => {}
    } as MouseEvent;

    this.onMouseUp(mouseEvent);
  }
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (!this.enableEdit || !this.selected) return;

    const step = 15 * 60 * 1000; // 15 minutes in milliseconds
    let newTime: Date | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        newTime = new Date(this.selectedTimeRange.start!.getTime() - step);
        break;
      case 'ArrowRight':
        newTime = new Date(this.selectedTimeRange.start!.getTime() + step);
        break;
      case 'Escape':
        this.cancelSelection();
        return;
    }

    if (newTime) {
      event.preventDefault();
      // Check if new time is valid before updating
      this.updateSelectionTime(newTime);
    }
  }

  ngOnInit() {

  }


  ngAfterViewInit() {

    if (this.dp) {

    }
    if (this.enableEdit) {
      if (this.canvasEdit) {
        this.dataService.activeVisualizer.subscribe(visualizer => {
          if (visualizer) {
            this.initializeCanvas(this.canvasEdit);
          }
        })
        //this.initializeCanvas();
      }
    } else {
      if (this.canvasNonEdit) {
        this.dataService.activeVisualizer.subscribe(visualizer => {
          if (visualizer) {
            this.initializeCanvas(this.canvasNonEdit);
          }
        })
        //this.initializeCanvas();
      }
    }

    this.web.getInstrumentUsage(this.instrument.id, this.dateBeforeCurrent, this.dateAfterCurrent).subscribe((usage) => {
      this.instrumentUsageQuery = usage
      const hasMaintenance = usage.results.filter(usage => usage.maintenance)
      this.selectedRangeOut.emit({started: this.dateBeforeCurrent, ended: this.dateAfterCurrent, hasMaintenance: hasMaintenance.length > 0})
    })

  }

  initializeCanvas(canvas: ElementRef<HTMLCanvasElement>) {
    setTimeout(() => {
      const ctx = canvas.nativeElement.getContext('2d');
      if (this.instrument) {
        // @ts-ignore
        this.web.getInstrumentUsage(this.instrument.id, this.form.value.windowStart, this.form.value.windowEnd).subscribe((data) => {
          this.instrumentUsageQuery = data
          if (ctx) {
            this.ctx = ctx
            // draw time blocks from the start of the day before the current time to the end of the day after the current time
            this.prepare(canvas).then();
          }
        })
      }
    }, 1000)
  }

  ngAfterViewChecked() {
    if (this.enableEdit) {
      if (this.canvasEdit && !this.ctx) {

        //this.initializeCanvas(this.canvasEdit);
      }
    } else {
      if (this.canvasNonEdit && !this.ctx) {

        //this.initializeCanvas(this.canvasNonEdit);
      }
    }

  }

  changeActiveIDTab(id: string) {
    if (id === "hourBasedBookings") {
      // Always reinitialize canvas when tab becomes active
      if (this.enableEdit && this.canvasEdit) {
        this.initializeCanvas(this.canvasEdit);
      } else if (this.canvasNonEdit) {
        this.initializeCanvas(this.canvasNonEdit);
      }

      // Auto-update window when switching to this tab
      if (this.fromDate && this.toDate) {
        this.updateTimeWindow();
      }

      // Ensure proper rendering
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  }

  private async prepare(canvas: ElementRef<HTMLCanvasElement>) {
    this.clearCanvas();
    const timeBlocks: Date[] = [];
    const windowStart = this.form.value.windowStart;
    const windowEnd = this.form.value.windowEnd;
    if (windowStart && windowEnd) {
      let current = windowStart;
      while (current <= windowEnd) {
        timeBlocks.push(new Date(current));
        current = new Date(current.getTime() + 60 * 60 * 1000); // Increment by 1 hour
      }
      this.timeBlocks = timeBlocks;

      // Calculate the canvas width dynamically based on the time range and desired resolution
      const hoursInRange = (windowEnd.getTime() - windowStart.getTime()) / (60 * 60 * 1000);
      const pixelsPerHour = Math.max(30, Math.min(60, window.innerWidth / hoursInRange)); // Responsive pixel density
      this.width = Math.floor(hoursInRange * pixelsPerHour);

      // Set the canvas width property with high-DPI support
      this.setupCanvas(canvas.nativeElement);

      // Update the context after setting the canvas width
      this.ctx = canvas.nativeElement.getContext('2d')!;
      this.setupCanvasRendering();

      const delta = windowEnd.getTime() - windowStart.getTime();

      this.dataService.changeDPI(300, canvas.nativeElement);
      this.drawBackground(this.timeBlocks, this.width, new Date(), delta);
    }
  }

  private drawBackground(timeBlocks: Date[], graphWidth: number, currentMarker: Date, windowTimeRange: number) {
    // Cache key for background
    const cacheKey = `bg_${windowTimeRange}_${graphWidth}_${this.instrumentUsageQuery?.results.length || 0}`;
    
    // Clear and set up for drawing
    this.ctx.save();
    this.ctx.fillStyle = '#f8f9fa'; // Light gray background
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw grid and time labels
    this.drawTimeGrid(timeBlocks, graphWidth, windowTimeRange);
    
    // Draw booking blocks with improved styling
    this.drawBookingBlocks(graphWidth, windowTimeRange);
    
    // Draw selected time range
    this.drawSelectedTimeRange(graphWidth, windowTimeRange);
    
    // Draw current time marker
    this.drawCurrentTimeMarker(currentMarker, graphWidth, windowTimeRange);
    
    this.ctx.restore();
  }

  clearCanvas() {
    if (this.enableEdit) {
      this.ctx.clearRect(0, 0, this.canvasEdit.nativeElement.width, this.canvasEdit.nativeElement.height)
    } else {
      this.ctx.clearRect(0, 0, this.canvasNonEdit.nativeElement.width, this.canvasNonEdit.nativeElement.height)
    }

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
    this.dragEnd = event.offsetX;
    const positionInTime = this.convertPixelToTime(event.offsetX)

    // check if the position is within an existing instrumentUsage block
    const overLappingUsage = this.instrumentUsageQuery!.results.filter(usage => {
      if (usage.time_started && usage.time_ended) {
        return positionInTime.getTime() >= usage.time_started.getTime() && positionInTime.getTime() <= usage.time_ended.getTime()
      }
      return false
    })
    const hasMaintenance = overLappingUsage.filter(usage => usage.maintenance)
    if (hasMaintenance.length > 0) {
      this.toastService.show("Instrument Usage", "This time is blocked for maintenance")
      return
    }
    if (overLappingUsage.length > 0) {
      if (this.enableDelete && this.enableEdit && (overLappingUsage[0].user === this.accounts.username||this.accounts.is_staff)) {
        this.toastService.show("Instrument Usage", "Selected instrument usage block")
        this.selectedUsageBlock.emit(overLappingUsage[0])
      } else {
        if (!this.dataService.serverSettings.allow_overlap_bookings) {
          this.toastService.show("This time is already booked", "Please select another time")
        } else {
          this.selectedUsageBlock.emit(overLappingUsage[0])
        }
      }
      return
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
        if (this.selectedTimeRange.start && this.selectedTimeRange.end) {
          // Update date values
          this.selectedStartDate = new Date(this.selectedTimeRange.start);
          this.selectedEndDate = new Date(this.selectedTimeRange.end);

          // Update time pickers
          this.startTime = {
            hour: this.selectedStartDate.getHours(),
            minute: this.selectedStartDate.getMinutes()
          };

          this.endTime = {
            hour: this.selectedEndDate.getHours(),
            minute: this.selectedEndDate.getMinutes()
          };
        }
        this.selectedEnd = undefined
        this.selectedStart = undefined
        this.dragStart = undefined
        this.dragEnd = undefined
        //this.selectedEndDate = undefined
        //this.selectedStartDate = undefined
        this.selected = false
        this.web.getInstrumentUsage(this.instrument.id, this.selectedTimeRange.start!, this.selectedTimeRange.end!)
          .subscribe((data) => {
            const hasMaintenance = data.results.filter(usage => usage.maintenance)
            // Don't replace instrumentUsageQuery, just check for maintenance
            this.selectedRangeOut.emit({started: this.selectedTimeRange.start!, ended: this.selectedTimeRange.end!, hasMaintenance: hasMaintenance.length > 0})
          })
      }
    }
  }

  onMouseMove(event: MouseEvent) {
    if (!this.lastMoveTime || Date.now() - this.lastMoveTime > 16) { // 60fps throttling
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      
      this.animationFrameId = requestAnimationFrame(() => {
        this.drawMarker(event.offsetX, '#333');
        this.lastMoveTime = Date.now();

        const currentTime = this.convertPixelToTime(event.offsetX);

        if (this.enableEdit && this.dragStart) {
          // During dragging operation
          this.dragEnd = event.offsetX;
          this.previewEndDate = currentTime;
          this.draw();
        } else if (this.enableEdit) {
          // Just hover - don't update input fields
          this.previewStartDate = currentTime;
        }

        // Draw the tooltip with improved styling
        this.drawTimeTooltip(event.offsetX, currentTime);
      });
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
      this.requiredApprovalMaxDaysAhead = this.checkingStartDateIfFurtherThanInstrumentMaxAhead(new Date(date.year, date.month - 1, date.day));
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
      this.requiredApprovalMaxDaysDuration = this.checkingIfDurationIsLongerThanInstrumentMaxDays(new Date(this.fromDate.year, this.fromDate.month - 1, this.fromDate.day), new Date(date.year, date.month - 1, date.day));
      // Auto-update when both dates are selected
      this.updateTimeWindow();
    } else {
      this.toDate = null;
      this.fromDate = date;
      this.requiredApprovalMaxDaysAhead = this.checkingStartDateIfFurtherThanInstrumentMaxAhead(new Date(date.year, date.month - 1, date.day));
    }
    if (this.fromDate && this.toDate) {
      // get bookings between the selected date range
      const startDate = new Date(this.fromDate.year, this.fromDate.month - 1, this.fromDate.day,0);
      const endDate = new Date(this.toDate.year, this.toDate.month - 1, this.toDate.day, 23, 59, 59, 999);

      this.web.getInstrumentUsage(this.instrument.id, startDate, endDate).subscribe((data) => {
        this.instrumentUsageQuery = data;
        const hasMaintenance = this.instrumentUsageQuery.results.filter(usage => usage.maintenance)
        this.selectedRangeOut.emit({started: startDate, ended: endDate, hasMaintenance: hasMaintenance.length > 0})

        if (this.enableEdit) {
          this.prepare(this.canvasEdit).then();
        } else {
          this.prepare(this.canvasNonEdit).then();
        }
      });
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
      const start = new Date(this.fromDate.year, this.fromDate.month - 1, this.fromDate.day);
      const end = new Date(this.toDate.year, this.toDate.month - 1, this.toDate.day);
      // set end date to the end of the day
      end.setHours(23, 59, 59, 999);

      this.form.controls.windowStart.setValue(start);
      this.form.controls.windowEnd.setValue(end);

      // Retrieve the current jobs that have already been booked on the time window
      this.web.getInstrumentUsage(this.instrument.id, start, end).subscribe((data) => {
        this.instrumentUsageQuery = data;
        if (this.enableEdit) {
          this.prepare(this.canvasEdit).then();
        } else {
          this.prepare(this.canvasNonEdit).then();
        }

        // Update selected dates display
        this.selectedStartDate = start;
        this.selectedEndDate = end;
      });
    }
  }

  drawMarker(pixel: number, color: string) {
    this.clearCanvas()
    this.draw()
    this.ctx.fillStyle = color
    this.ctx.fillRect(pixel, 0, 1, this.height)
  }

  ngOnDestroy() {
    this.selectedTimeRange = {start: null, end: null};
    // Clean up animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    // Clear render cache
    this.renderCache.clear();
  }

  handleDateNavigate(event: NgbDatepickerNavigateEvent) {
    if (this.dp) {
      if (event.current) {
        const currentDate = new Date(event.current.year, event.current.month - 1, 0)
        const nextDate = new Date(event.next.year, event.next.month - 1, 0)
        // check if current is less than next
        if (currentDate.getTime() < nextDate.getTime()) {
          this.web.getInstrumentUsage(this.instrument.id, new Date(event.current.year, event.current.month), new Date(event.next.year, event.next.month+1)).subscribe((data) => {
            this.calendarUsageQuery = data
          })
        } else {
          this.web.getInstrumentUsage(this.instrument.id, new Date(event.next.year, event.next.month - 1), new Date(event.current.year, event.current.month)).subscribe((data) => {
            this.calendarUsageQuery = data
          })
        }
      }
    } else {
      if (!event.current) {
        const current = event.next
        const startDateFromCurrent = new Date(current.year, current.month - 1, 0)
        const endDateFromCurrent = new Date(current.year, current.month + 1, 0)
        this.web.getInstrumentUsage(this.instrument.id, startDateFromCurrent, endDateFromCurrent).subscribe((data) => {
          this.calendarUsageQuery = data
        })
      }
    }
  }

  hasInstrumentUsage(date: NgbDate) {
    if (this.calendarUsageQuery) {
      for (const usage of this.calendarUsageQuery.results) {
        if (usage.time_started && usage.time_ended) {
          const usageStart = new Date(usage.time_started).getTime();
          const usageEnd = new Date(usage.time_ended).getTime();
          const dateStart = new Date(date.year, date.month - 1, date.day).getTime();
          const dateEnd = new Date(date.year, date.month - 1, date.day, 23, 59, 59, 999).getTime();

          // Check if the usage overlaps with the date
          if ((usageStart >= dateStart && usageStart <= dateEnd) || (usageEnd >= dateStart && usageEnd <= dateEnd) || (usageStart <= dateStart && usageEnd >= dateEnd)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  hasInstrumentUsageMaintenance(date: NgbDate) {
    if (this.calendarUsageQuery) {
      for (const usage of this.calendarUsageQuery.results) {
        if (usage.time_started && usage.time_ended && usage.maintenance) {
          const usageStart = new Date(usage.time_started).getTime();
          const usageEnd = new Date(usage.time_ended).getTime();
          const dateStart = new Date(date.year, date.month - 1, date.day).getTime();
          const dateEnd = new Date(date.year, date.month - 1, date.day, 23, 59, 59, 999).getTime();

          // Check if the usage overlaps with the date
          if ((usageStart >= dateStart && usageStart <= dateEnd) || (usageEnd >= dateStart && usageEnd <= dateEnd) || (usageStart <= dateStart && usageEnd >= dateEnd)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  getTooltipContent(date: NgbDate) {
    if (this.calendarUsageQuery) {
      const bookings = this.calendarUsageQuery.results.filter(usage => {
        const usageStart = new Date(usage.time_started).getTime();
        const usageEnd = new Date(usage.time_ended).getTime();
        const dateStart = new Date(date.year, date.month - 1, date.day).getTime();
        const dateEnd = new Date(date.year, date.month - 1, date.day, 23, 59, 59, 999).getTime();
        return (usageStart >= dateStart && usageStart <= dateEnd) || (usageEnd >= dateStart && usageEnd <= dateEnd) || (usageStart <= dateStart && usageEnd >= dateEnd);
      });

      if (bookings.length > 0) {
        const users: string[] = [];
        for (const booking of bookings) {
          users.push(booking.user);
        }
        return Array.from(new Set(users)).join(', ');
      }
    }
    return 'No bookings';
  }

  removeBooking(usage: InstrumentUsage) {
    this.web.deleteInstrumentUsage(usage.id).subscribe((data) => {
      this.toastService.show("Instrument Usage", "Booking removed");
    })
  }

  delayUsage(usage: InstrumentUsage, days: number) {
    this.web.instrumentUsageDelayUsage(usage.id, days).subscribe((data) => {
      if (this.calendarUsageQuery) {
        for (const usage of this.calendarUsageQuery.results) {
          if (usage.id === data.id) {
            usage.time_started = data.time_started;
            usage.time_ended = data.time_ended;
          }
        }
      }
      if (this.instrumentUsageQuery) {
        for (const usage of this.instrumentUsageQuery.results) {
          if (usage.id === data.id) {
            usage.time_ended = data.time_ended;
            usage.time_started = data.time_started;
          }
        }
      }
    })
  }

  restartCanvas() {
    if (this.enableEdit) {
      this.initializeCanvas(this.canvasEdit);
    } else {
      this.initializeCanvas(this.canvasNonEdit);
    }
  }

  toggleApproval(booking: InstrumentUsage): void {
    this.web.approveUsageToggle(booking.id).subscribe((result) => {
      if (this.instrumentUsageQuery) {
        this.instrumentUsageQuery.results = this.instrumentUsageQuery.results.map((b) => {
          if (b.id === booking.id) {
            b.approved = !b.approved;
          }
          return b;
        });
      }
    })
  }

  checkingStartDateIfFurtherThanInstrumentMaxAhead(date: Date) {
    if (this.instrument) {
      const maxDaysAhead = this.instrument.max_days_ahead_pre_approval;
      const currentDate = new Date();
      const diffInDays = Math.ceil((date.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));

      return diffInDays > maxDaysAhead
        //&& maxDaysAhead !== 0;
    }
    return false;
  }

  checkingIfDurationIsLongerThanInstrumentMaxDays(start: Date, end: Date) {
    if (this.instrument) {
      const maxDays = this.instrument.max_days_within_usage_pre_approval;
      const durationInDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));

      return durationInDays > maxDays
        //&& maxDays !== 0;
    }
    return false;
  }

  private drawWithAnimation() {
    requestAnimationFrame(() => {
      this.clearCanvas();
      this.draw();
    });
  }

  private drawTimeTooltip(x: number, time: Date) {
    const formattedTime = time.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: false});
    const formattedDate = time.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});

    // Calculate tooltip dimensions
    const tooltipWidth = 140;
    const tooltipHeight = 50;
    const tooltipX = Math.max(10, Math.min(x - tooltipWidth / 2, this.width - tooltipWidth - 10));
    const tooltipY = 30;

    // Draw tooltip background with rounded corners
    this.ctx.fillStyle = 'rgba(33, 37, 41, 0.95)';
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;
    this.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
    this.ctx.fill();
    this.ctx.stroke();

    // Draw tooltip content
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(formattedTime, tooltipX + tooltipWidth / 2, tooltipY + 18);
    
    this.ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillStyle = '#adb5bd';
    this.ctx.fillText(formattedDate, tooltipX + tooltipWidth / 2, tooltipY + 35);
    
    // Reset text alignment
    this.ctx.textAlign = 'start';
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  private drawBookingBlock(startX: number, width: number, type: 'own'|'others'|'selected'|'maintenance', label: string) {
    const colors = {
      own: { bg: 'rgba(25, 118, 210, 0.6)', text: 'white' },
      others: { bg: 'rgba(146, 9, 207, 0.4)', text: 'white' },
      selected: { bg: 'rgba(76, 175, 80, 0.6)', text: 'white' },
      maintenance: { bg: 'rgba(244, 67, 54, 0.6)', text: 'white' }
    };

    // Draw gradient background for better visual distinction
    const gradient = this.ctx.createLinearGradient(startX, 0, startX + width, 0);
    const color = colors[type];

    gradient.addColorStop(0, color.bg);
    gradient.addColorStop(1, this.adjustColor(color.bg, 0.9));

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(startX, 0, width, this.height);

    // Add booking label
    this.ctx.fillStyle = color.text;
    this.ctx.font = '11px Arial';
    this.ctx.textBaseline = 'top';

    // Truncate text if needed
    const maxWidth = width - 10;
    let displayText = label;
    if (this.ctx.measureText(label).width > maxWidth) {
      let truncated = label;
      while (this.ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
      }
      displayText = truncated + '...';
    }

    this.ctx.fillText(displayText, startX + 5, 5);
  }

  private adjustColor(rgba: string, factor: number): string {
    // Parse rgba string and adjust rgb values
    const match = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\)/);
    if (match) {
      const r = Math.min(255, Math.floor(parseInt(match[1]) * factor));
      const g = Math.min(255, Math.floor(parseInt(match[2]) * factor));
      const b = Math.min(255, Math.floor(parseInt(match[3]) * factor));
      const a = parseFloat(match[4]);
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return rgba;
  }

  private checkForTimeConflicts(start: Date, end: Date): boolean {
    if (!this.instrumentUsageQuery) return false;

    return this.instrumentUsageQuery.results.some(usage => {
      if (!usage.time_started || !usage.time_ended) return false;
      const usageStart = new Date(usage.time_started).getTime();
      const usageEnd = new Date(usage.time_ended).getTime();
      return (start.getTime() < usageEnd && end.getTime() > usageStart);
    });
  }

  private updateSelectionTime(newStartTime: Date) {
    // Calculate duration of current selection
    const duration = this.selectedTimeRange.end!.getTime() - this.selectedTimeRange.start!.getTime();
    const newEndTime = new Date(newStartTime.getTime() + duration);

    // Check for conflicts
    const hasConflicts = this.checkForTimeConflicts(newStartTime, newEndTime);
    if (!hasConflicts) {
      this.selectedTimeRange = { start: newStartTime, end: newEndTime };
      this.draw();
    }
  }

  private cancelSelection() {
    this.selectedTimeRange = {start: null, end: null};
    this.selected = false;
    this.dragStart = undefined;
    this.dragEnd = undefined;
    this.selectedStart = undefined;
    this.selectedEnd = undefined;
    this.draw();
  }

  toggleStartTimepicker(): void {
    this.showStartTimepicker = !this.showStartTimepicker;
    if (this.showStartTimepicker && this.selectedStartDate) {
      this.startTime = {
        hour: this.selectedStartDate.getHours(),
        minute: this.selectedStartDate.getMinutes()
      };
    }
  }

  toggleEndTimepicker(): void {
    this.showEndTimepicker = !this.showEndTimepicker;
    if (this.showEndTimepicker && this.selectedEndDate) {
      this.endTime = {
        hour: this.selectedEndDate.getHours(),
        minute: this.selectedEndDate.getMinutes()
      };
    }
  }

  onTimePickerChange(time: any, type: 'start' | 'end'): void {
    if (type === 'start' && this.selectedStartDate) {
      const newDate = new Date(this.selectedStartDate);
      newDate.setHours(time.hour, time.minute);

      // Only update if there's no conflict
      if (this.selectedEndDate && this.validateTimeChange(newDate, this.selectedEndDate)) {
        this.selectedStartDate = newDate;
        this.updateCanvasSelection();
      } else {
        // Reset time picker to current value
        this.startTime = {
          hour: this.selectedStartDate.getHours(),
          minute: this.selectedStartDate.getMinutes()
        };
      }
    } else if (type === 'end' && this.selectedEndDate) {
      const newDate = new Date(this.selectedEndDate);
      newDate.setHours(time.hour, time.minute);

      // Only update if there's no conflict
      if (this.selectedStartDate && this.validateTimeChange(this.selectedStartDate, newDate)) {
        this.selectedEndDate = newDate;
        this.updateCanvasSelection();
      } else {
        // Reset time picker to current value
        this.endTime = {
          hour: this.selectedEndDate.getHours(),
          minute: this.selectedEndDate.getMinutes()
        };
      }
    }
  }


  onTimeInputChange(value: string, type: 'start' | 'end'): void {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        if (type === 'start') {
          // Preserve current time when changing date
          if (this.selectedStartDate) {
            date.setHours(this.selectedStartDate.getHours(), this.selectedStartDate.getMinutes());
          }

          // Validate before updating
          if (this.selectedEndDate && this.validateTimeChange(date, this.selectedEndDate)) {
            this.selectedStartDate = date;
            this.startTime = { hour: date.getHours(), minute: date.getMinutes() };
            this.updateCanvasSelection();
          }
        } else {
          // Preserve current time when changing date
          if (this.selectedEndDate) {
            date.setHours(this.selectedEndDate.getHours(), this.selectedEndDate.getMinutes());
          }

          // Validate before updating
          if (this.selectedStartDate && this.validateTimeChange(this.selectedStartDate, date)) {
            this.selectedEndDate = date;
            this.endTime = { hour: date.getHours(), minute: date.getMinutes() };
            this.updateCanvasSelection();
          }
        }
      }
    } catch (e) {
      console.error('Invalid date format');
    }
  }

  private validateTimeChange(newStart: Date, newEnd: Date): boolean {
    // Check for conflicts with existing bookings
    const hasConflicts = this.checkForTimeConflicts(newStart, newEnd);

    if (hasConflicts) {
      // Alert the user about the conflict
      this.toastService.show("Time Conflict", "The selected time range conflicts with existing bookings.");
      return false;
    }

    return true;
  }

  updateCanvasSelection(): void {
    if (this.selectedStartDate && this.selectedEndDate) {
      if (!this.validateTimeChange(this.selectedStartDate, this.selectedEndDate)) {
        return;
      }

      const startX = this.convertTimeToPixel(this.selectedStartDate);
      const endX = this.convertTimeToPixel(this.selectedEndDate);

      this.dragStart = startX;
      this.dragEnd = endX;
      this.selectedTimeRange = {
        start: this.selectedStartDate,
        end: this.selectedEndDate
      };
      this.drawWithAnimation();
    }
  }

  getDuration(start: Date, end: Date): string {
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }

  convertTimeToPixel(time: Date): number {
    const windowStart = this.form.value.windowStart;
    const windowEnd = this.form.value.windowEnd;

    if (windowStart && windowEnd) {
      const delta = windowEnd.getTime() - windowStart.getTime();
      const canvasWidth = this.width - this.padding * 2;
      const timeOffset = time.getTime() - windowStart.getTime();

      // Calculate the pixel position
      const pixelOffset = (timeOffset / delta) * canvasWidth;
      return pixelOffset + this.padding;
    }

    return this.padding;
  }

  private setupCanvas(canvas: HTMLCanvasElement): void {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = this.width * dpr;
    canvas.height = this.height * dpr;
    canvas.style.width = `${this.width}px`;
    canvas.style.height = `${this.height}px`;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }

  private setupCanvasRendering(): void {
    if (this.ctx) {
      // Enable antialiasing and smooth rendering
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }
  }

  private drawTimeGrid(timeBlocks: Date[], graphWidth: number, windowTimeRange: number): void {
    const graphPixelOverTime = graphWidth / windowTimeRange;
    let currentDrawDate = 0;
    const uniqueDateFromTimeBlocks = timeBlocks.filter(time => {
      if (time.getDate() !== currentDrawDate) {
        currentDrawDate = time.getDate();
        return true;
      }
      return false;
    });

    // Draw day backgrounds with alternating colors
    uniqueDateFromTimeBlocks.forEach((time, index) => {
      const filteredTimeBlocks = timeBlocks.filter(timeBlock => timeBlock.getDate() === time.getDate());
      const pixelStart = (time.getTime() - this.form.value.windowStart!.getTime()) * graphPixelOverTime;
      const dayWidth = filteredTimeBlocks.length * (graphPixelOverTime * 60 * 60 * 1000);

      // Alternating day background colors
      this.ctx.fillStyle = index % 2 === 0 ? '#f8f9fa' : '#e9ecef';
      this.ctx.fillRect(pixelStart, 0, dayWidth, this.height);

      // Day separator line
      this.ctx.strokeStyle = '#dee2e6';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(pixelStart, 0);
      this.ctx.lineTo(pixelStart, this.height);
      this.ctx.stroke();

      // Date label with better typography
      this.ctx.fillStyle = '#495057';
      this.ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), pixelStart + 5, 8);

      // Hour markers with improved styling
      filteredTimeBlocks.forEach(timeBlock => {
        const hour = timeBlock.getHours();
        const timeBlockPixelStart = (timeBlock.getTime() - this.form.value.windowStart!.getTime()) * graphPixelOverTime;

        // Major hour markers (every 2 hours)
        if (hour % 2 === 0) {
          this.ctx.fillStyle = '#6c757d';
          this.ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          this.ctx.textBaseline = 'bottom';
          this.ctx.save();
          this.ctx.translate(timeBlockPixelStart + 2, this.height - 5);
          this.ctx.rotate(-Math.PI / 2);
          this.ctx.fillText(timeBlock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), 0, 0);
          this.ctx.restore();
        }

        // Hour grid lines
        this.ctx.strokeStyle = hour % 2 === 0 ? '#adb5bd' : '#dee2e6';
        this.ctx.lineWidth = hour % 2 === 0 ? 1 : 0.5;
        this.ctx.setLineDash(hour % 2 === 0 ? [] : [3, 3]);
        this.ctx.beginPath();
        this.ctx.moveTo(timeBlockPixelStart, 0);
        this.ctx.lineTo(timeBlockPixelStart, hour % 2 === 0 ? 10 : 5);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      });
    });
  }

  private drawBookingBlocks(graphWidth: number, windowTimeRange: number): void {
    if (!this.instrumentUsageQuery) return;

    const graphPixelOverTime = graphWidth / windowTimeRange;
    
    for (const usage of this.instrumentUsageQuery.results) {
      usage.time_started = new Date(usage.time_started);
      usage.time_ended = new Date(usage.time_ended);
      
      const isSelectedBooking = this.selectedTimeRange.start && this.selectedTimeRange.end &&
        usage.time_started.getTime() === this.selectedTimeRange.start.getTime() &&
        usage.time_ended.getTime() === this.selectedTimeRange.end.getTime();
      
      if (!isSelectedBooking) {
        const start = new Date(usage.time_started);
        const end = new Date(usage.time_ended);
        const delta = end.getTime() - start.getTime();
        const deltaPixel = delta * graphPixelOverTime;
        const deltaStart = start.getTime() - this.form.value.windowStart!.getTime();
        const deltaStartPixel = this.padding + deltaStart * graphPixelOverTime;

        // Determine booking type and color
        let bookingType: 'own' | 'others' | 'maintenance';
        if (usage.maintenance) {
          bookingType = 'maintenance';
        } else if (usage.user === this.accounts.username) {
          bookingType = 'own';
        } else {
          bookingType = 'others';
        }

        this.drawBookingBlock(
          this.padding + deltaStartPixel, 
          deltaPixel, 
          bookingType, 
          usage.maintenance ? 'Maintenance' : `${usage.user}`
        );
      }
    }
  }

  private drawSelectedTimeRange(graphWidth: number, windowTimeRange: number): void {
    if (this.selectedTimeRange.start && this.selectedTimeRange.end) {
      const graphPixelOverTime = graphWidth / windowTimeRange;
      const start = this.selectedTimeRange.start;
      const end = this.selectedTimeRange.end;
      const delta = end.getTime() - start.getTime();
      const deltaPixel = delta * graphPixelOverTime;
      const deltaStart = start.getTime() - this.form.value.windowStart!.getTime();
      const deltaStartPixel = this.padding + deltaStart * graphPixelOverTime;
      
      this.drawBookingBlock(
        this.padding + deltaStartPixel, 
        deltaPixel, 
        'selected', 
        'Selected'
      );
    }
  }

  private drawCurrentTimeMarker(currentMarker: Date, graphWidth: number, windowTimeRange: number): void {
    const graphPixelOverTime = graphWidth / windowTimeRange;
    const deltaTime = currentMarker.getTime() - this.form.value.windowStart!.getTime();
    const x = this.padding + deltaTime * graphPixelOverTime;
    
    // Draw current time line with better styling
    this.ctx.strokeStyle = '#dc3545';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([]);
    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, this.height);
    this.ctx.stroke();
    
    // Add current time label
    this.ctx.fillStyle = '#dc3545';
    this.ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('NOW', x, 25);
    this.ctx.textAlign = 'start';
  }

}
