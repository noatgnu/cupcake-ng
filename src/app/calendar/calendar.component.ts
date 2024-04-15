import { Component } from '@angular/core';
import {NgbDatepicker} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../web.service";
import {ProtocolSession} from "../protocol-session";

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
  constructor(private web: WebService) {
    this.getSession()
  }

  calendarSessions: ProtocolSession[] = []

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
    })

  }

}
