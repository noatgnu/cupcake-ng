import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbDate, NgbDatepicker, NgbDateStruct, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { WebService } from "../web.service";
import { ProtocolSession } from "../protocol-session";
import { Router } from "@angular/router";
import { CalendarSessionModalComponent } from "./calendar-session-modal/calendar-session-modal.component";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {DatePipe, NgClass} from "@angular/common";

@Component({
  selector: 'app-calendar',
  imports: [
    NgbDatepicker,
    NgClass,
    DatePipe,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit {
  @ViewChild('datepicker') datepicker: NgbDatepicker | undefined;

  calendarSessions: ProtocolSession[] = [];
  dateToSession: { [key: string]: ProtocolSession[] } = {};

  startDate: Date;
  endDate: Date;
  currentView: 'month' | 'week' | 'day' = 'month';
  isLoading: boolean = false;
  filterForm: FormGroup;

  // Color mapping for different protocol types
  protocolColors: { [key: string]: string } = {};

  // Track selected day for detailed view
  selectedDate: Date | null = null;
  readonly Object = Object;
  constructor(
    private web: WebService,
    private modal: NgbModal,
    private fb: FormBuilder,
    private router: Router
  ) {
    const currentDate = new Date();
    this.startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    this.endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    this.filterForm = this.fb.group({
      protocolType: ['all'],
      status: ['all'],
      searchTerm: ['']
    });
  }

  ngOnInit() {
    this.getSession();

    // Subscribe to filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  getStartOfMonth(): Date {
    return new Date(this.startDate.getFullYear(), this.startDate.getMonth(), 1);
  }

  getEndOfMonth(): Date {
    return new Date(this.startDate.getFullYear(), this.startDate.getMonth() + 1, 0);
  }

  getStartOfWeek(): Date {
    const date = new Date(this.startDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(date.setDate(diff));
  }

  getEndOfWeek(): Date {
    const startOfWeek = this.getStartOfWeek();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return endOfWeek;
  }

  navigatePrevious() {
    if (this.currentView === 'month') {
      this.startDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth() - 1, 1);
    } else if (this.currentView === 'week') {
      this.startDate = new Date(this.startDate.setDate(this.startDate.getDate() - 7));
    } else { // day view
      this.startDate = new Date(this.startDate.setDate(this.startDate.getDate() - 1));
    }
    this.getSession();
  }

  navigateNext() {
    if (this.currentView === 'month') {
      this.startDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth() + 1, 1);
    } else if (this.currentView === 'week') {
      this.startDate = new Date(this.startDate.setDate(this.startDate.getDate() + 7));
    } else { // day view
      this.startDate = new Date(this.startDate.setDate(this.startDate.getDate() + 1));
    }
    this.getSession();
  }

  setView(view: 'month' | 'week' | 'day') {
    this.currentView = view;
    this.getSession();
  }

  goToToday() {
    const today = new Date();
    this.startDate = new Date(today);
    if (this.currentView === 'month') {
      this.startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (this.currentView === 'week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      this.startDate = new Date(today.setDate(diff));
    }
    this.getSession();
  }

  getSession() {
    this.isLoading = true;
    this.dateToSession = {};

    let start: Date, end: Date;

    if (this.currentView === 'month') {
      start = this.getStartOfMonth();
      end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    } else if (this.currentView === 'week') {
      start = this.getStartOfWeek();
      end = new Date(start);
      end.setDate(start.getDate() + 7);
    } else { // day view
      start = new Date(this.startDate);
      end = new Date(start);
      end.setDate(start.getDate() + 1);
    }

    const startString = start.toISOString().split("T")[0];
    const endString = end.toISOString().split("T")[0];

    this.web.getCalendarSessions(startString, endString).subscribe({
      next: (data) => {
        this.calendarSessions = data;
        this.populateDateToSession();
        this.assignProtocolColors();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load sessions:', err);
        this.isLoading = false;
      }
    });
  }

  populateDateToSession() {
    this.dateToSession = {};

    this.calendarSessions.forEach((session) => {
      if (session.started_at) {
        session.started_at = new Date(session.started_at);

        if (session.ended_at) {
          session.ended_at = new Date(session.ended_at);

          // Add session to all dates it spans
          const currentDate = new Date(session.started_at);
          while (currentDate <= session.ended_at) {
            const dateString = currentDate.toISOString().split("T")[0];

            if (!this.dateToSession[dateString]) {
              this.dateToSession[dateString] = [];
            }

            // Avoid duplicates
            if (!this.dateToSession[dateString].some(s => s.id === session.id)) {
              this.dateToSession[dateString].push(session);
            }

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
          }
        } else {
          // For sessions without end date, just add to the start date
          const dateString = session.started_at.toISOString().split("T")[0];

          if (!this.dateToSession[dateString]) {
            this.dateToSession[dateString] = [];
          }

          this.dateToSession[dateString].push(session);
        }
      }
    });
  }

  assignProtocolColors() {
    // Get unique protocol types
    const protocolTypes = new Set<number>();

    this.calendarSessions.forEach(session => {
      if (session.protocols && session.protocols.length > 0) {
        session.protocols.forEach(protocol => {
          protocolTypes.add(protocol);
        });
      }
    });

    // Assign colors
    const colors = [
      '#4285F4', '#EA4335', '#FBBC05', '#34A853',
      '#8E24AA', '#00ACC1', '#FF7043', '#7CB342'
    ];

    Array.from(protocolTypes).forEach((protocol, index) => {
      this.protocolColors[protocol] = colors[index % colors.length];
    });
  }

  applyFilters() {
    // This would re-filter the displayed sessions based on form values
    const filters = this.filterForm.value;

    // Implementation would depend on exactly how you want to filter
    // For now, just refresh the data
    this.getSession();
  }

  checkDateMatch(date: NgbDateStruct, dateString: string): boolean {
    const dateStr = new Date(date.year, date.month-1, date.day).toISOString().split("T")[0];
    return dateStr === dateString;
  }

  getSessionsForDate(date: NgbDateStruct): ProtocolSession[] {
    const dateStr = new Date(date.year, date.month-1, date.day).toISOString().split("T")[0];
    return this.dateToSession[dateStr] || [];
  }

  getDayClass(date: NgbDateStruct): string {
    const sessions = this.getSessionsForDate(date);
    if (sessions.length > 0) {
      return 'has-sessions';
    }
    return '';
  }

  selectDate(date: NgbDateStruct) {
    this.selectedDate = new Date(date.year, date.month-1, date.day);
    const dateStr = this.selectedDate.toISOString().split("T")[0];
    const sessions = this.dateToSession[dateStr] || [];

    if (sessions.length === 1) {
      this.handleClick(sessions[0]);
    } else if (sessions.length > 1) {
      this.openSessionListModal(sessions);
    }
  }

  getSessionColor(session: ProtocolSession): string {
    if (session.protocols && session.protocols.length > 0) {
      return this.protocolColors[session.protocols[0]] || '#6c757d';
    }
    return '#6c757d'; // default gray
  }

  getUniqueLink(session: ProtocolSession): string {
    return "/#/protocol-session/" + session.protocols[0] + "&" + session.unique_id;
  }

  handleClick(session: ProtocolSession) {
    const url = "#/protocol-session/" + session.protocols[0] + "&" + session.unique_id;
    window.open(url, '_blank');
  }

  openSessionListModal(sessions: ProtocolSession[]) {
    const ref = this.modal.open(CalendarSessionModalComponent, {
      size: 'lg',
      scrollable: true
    });
    ref.componentInstance.sessions = sessions;
  }

  addNewSession() {
  }

  getDateFromOffset(offset: number): Date {
    const date = new Date(this.startDate);
    date.setDate(date.getDate() + offset);
    return date;
  }


  getSessionsForDayOffset(offset: number): ProtocolSession[] {
    const date = this.getDateFromOffset(offset);
    const dateStr = date.toISOString().split("T")[0];
    return this.dateToSession[dateStr] || [];
  }

  getSessionTopPosition(session: ProtocolSession): number {
    if (!session.started_at) return 0;
    const hours = session.started_at.getHours();
    const minutes = session.started_at.getMinutes();
    return (hours * 60 + minutes) * (60 / 60); // 60px per hour
  }

  getSessionHeight(session: ProtocolSession): number {
    if (!session.started_at || !session.ended_at) return 60; // Default 1 hour

    const durationMs = session.ended_at.getTime() - session.started_at.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    return durationMinutes * (60 / 60); // 60px per hour
  }

  get today(): Date {
    return new Date();
  }
}
