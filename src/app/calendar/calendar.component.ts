import { Component } from '@angular/core';
import {NgbDate, NgbDatepicker, NgbDateStruct, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../web.service";
import {ProtocolSession} from "../protocol-session";
import {Router} from "@angular/router";
import {CalendarSessionModalComponent} from "./calendar-session-modal/calendar-session-modal.component";

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    NgbDatepicker
  ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent {

  startDate?: Date
  endDate?: Date
  constructor(private web: WebService, private modal: NgbModal) {
    this.getSession()
  }

  calendarSessions: ProtocolSession[] = []
  dateToSession: { [key: string]: ProtocolSession[] } = {}

  getStartOfMonth() {
    if (this.startDate) {
      return new Date(this.startDate.getFullYear(), this.startDate.getMonth(), 1)
    } else {
      const currentDate = new Date()
      return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    }
  }

  getEndOfMonth() {
    if (this.endDate) {
      return new Date(this.endDate.getFullYear(), this.endDate.getMonth()+1, 1)
    } else {
      const currentDate = new Date()
      return new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1)
    }
  }

  getSession() {
    // convert start and end date to string in YYYY-MM-DD format
    const start = this.getStartOfMonth()
    const end = this.getEndOfMonth()
    // convert to yyyy-mm-dd
    const startString = start.toISOString().split("T")[0]
    const endString = end.toISOString().split("T")[0]
    // get session data
    this.web.getCalendarSessions(startString, endString).subscribe((data) => {
      this.calendarSessions = data

      this.calendarSessions.forEach((session) => {

        if (session.started_at) {
          session.started_at = new Date(session.started_at)
          const dateString = new Date(session.started_at).toISOString().split("T")[0]
          if (this.dateToSession[dateString]) {
            this.dateToSession[dateString].push(session)
          } else {
            this.dateToSession[dateString] = [session]
          }
        }
        if (session.ended_at) {
          session.ended_at = new Date(session.ended_at)
        }
        // add session to all dates in between
        if (session.started_at && session.ended_at) {
          const currentDate = new Date(session.started_at)
          while (currentDate < session.ended_at) {
            currentDate.setDate(currentDate.getDate() + 1)
            const dateString = currentDate.toISOString().split("T")[0]
            if (this.dateToSession[dateString]) {
              this.dateToSession[dateString].push(session)
            } else {
              this.dateToSession[dateString] = [session]
            }
          }
        }
      })
      console.log(this.dateToSession)
    })

  }

  checkDateMatch(date: NgbDateStruct, dateString: string) {
    const dateStr = new Date(date.year, date.month-1, date.day).toISOString().split("T")[0]
    return dateStr === dateString
  }

  getUniqueLink(session: ProtocolSession) {
    return "/#/protocol-session/" + session.protocols[0] + "&" + session.unique_id
  }

  handleClick(session: ProtocolSession) {
    const url = "#/protocol-session/" + session.protocols[0] + "&" + session.unique_id
    window.open(url, '_blank')
  }

  openSessionListModal(sessions: ProtocolSession[]) {
    const ref = this.modal.open(CalendarSessionModalComponent, {scrollable: true})
    ref.componentInstance.sessions = sessions
  }

  protected readonly Object = Object;
}
