import {Component, OnInit} from '@angular/core';
import {Instrument, InstrumentUsage, InstrumentUsageQuery} from '../../../instrument';
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {WebService} from "../../../web.service";
import {User} from "../../../user";
import {DatePipe} from "@angular/common";

@Component({
  selector: 'app-instrument-booking-logs',
  imports: [
    ReactiveFormsModule,
    DatePipe
  ],
  templateUrl: './instrument-booking-logs.component.html',
  styleUrl: './instrument-booking-logs.component.scss'
})
export class InstrumentBookingLogsComponent implements OnInit {
  bookings: InstrumentUsageQuery|undefined;
  filteredBookings: InstrumentUsageQuery|undefined;
  filterForm: FormGroup;
  selected_instrument: Instrument|undefined;

  constructor(private web: WebService, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      users: [[]],
      instrument: ['']
    });
  }

  ngOnInit(): void {
    this.fetchBookings();
    this.filterForm.valueChanges.subscribe(() => {

    });
  }

  fetchBookings(): void {
    const threeDaysAgo = new Date();
    let users = []
    if (this.filterForm.value.users) {
      users = this.filterForm.value.users.map((user: User) => user.username)
    }
    if (this.filterForm.value.instrument) {
      this.web.getInstrumentUsage(this.filterForm.value.instrument.id, threeDaysAgo, new Date(), users).subscribe((data: InstrumentUsageQuery) => {
        this.bookings = data;

      });
    } else {
      this.web.getInstrumentUsage(undefined, threeDaysAgo, new Date(), users).subscribe((data: InstrumentUsageQuery) => {
        this.bookings = data;
        console.log(data)
      });
    }
  }

  getDaysWithBookings(): { date: Date, bookings: InstrumentUsage[] }[] {
    const daysWithBookings: { date: Date, bookings: InstrumentUsage[] }[] = [];
    if (this.bookings) {
      this.bookings.results.forEach(booking => {
        const bookingDate = new Date(booking.time_started);
        bookingDate.setHours(0, 0, 0, 0);

        let day = daysWithBookings.find(d => d.date.getTime() === bookingDate.getTime());
        if (!day) {
          day = { date: bookingDate, bookings: [] };
          daysWithBookings.push(day);
        }
        day.bookings.push(booking);
      });
    }


    return daysWithBookings;
  }
}
