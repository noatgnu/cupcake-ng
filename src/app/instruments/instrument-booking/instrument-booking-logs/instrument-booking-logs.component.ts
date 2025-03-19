import {Component, OnInit} from '@angular/core';
import {Instrument, InstrumentUsage, InstrumentUsageQuery} from '../../../instrument';
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {WebService} from "../../../web.service";
import {User} from "../../../user";
import {DatePipe} from "@angular/common";
import {debounceTime, distinctUntilChanged, map, Observable, OperatorFunction, switchMap} from 'rxjs';
import {NgbTooltip, NgbTypeahead} from "@ng-bootstrap/ng-bootstrap";
import {DataService} from "../../../data.service";
import {AccountsService} from "../../../accounts/accounts.service";

@Component({
  selector: 'app-instrument-booking-logs',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    NgbTypeahead,
    NgbTooltip
  ],
  templateUrl: './instrument-booking-logs.component.html',
  styleUrl: './instrument-booking-logs.component.scss'
})
export class InstrumentBookingLogsComponent implements OnInit {
  bookings: InstrumentUsageQuery|undefined;
  filteredBookings: InstrumentUsageQuery|undefined;
  filterForm: FormGroup;
  selected_instrument: Instrument|undefined;
  instrumentMap: { [key: number]: Instrument } = {};
  userModel: string = "";
  timeStarted: number = 30;

  constructor(private web: WebService, private fb: FormBuilder, public dataService: DataService, public accountService: AccountsService) {
    this.filterForm = this.fb.group({
      users: [[]],
      instrument: [[]],
      timeStarted: 30
    });
  }

  ngOnInit(): void {
    this.fetchBookings([], [], this.timeStarted);
    this.filterForm.valueChanges.subscribe((value) => {
      if (value) {
        if (this.filterForm) {
          let users = this.filterForm.value['users'];
          if (value.users) {
            users = value.users;
          }
          let instruments = this.filterForm.value['instrument'];
          if (value.instrument) {
            instruments = value.instrument;
          }
          let timeStarted = this.filterForm.value['timeStarted'];
          this.fetchBookings(users, instruments, timeStarted);
        }

      }
    });
  }

  fetchBookings(users: User[], instruments: Instrument[], timeStarted: number = 30): void {
    const currentDay = new Date();
    // calculate 30 days ago
    const someTimeAgo = new Date();
    someTimeAgo.setDate(someTimeAgo.getDate() - timeStarted);
    let searchUsers: string[] = []
    if (users) {
      searchUsers = users.map((user: User) => user.username)
    }
    let instrumentIds: number[] = []
    if (instruments) {
      instrumentIds = instruments.map((instrument: Instrument) => instrument.id)
    }
    this.web.getInstrumentUsage(instrumentIds, someTimeAgo, currentDay, searchUsers, 50, 0, "logs").subscribe((data: InstrumentUsageQuery) => {
      this.bookings = data;
    });

  }

  getDaysWithBookings(): { date: Date, bookings: InstrumentUsage[] }[] {
    const daysWithBookings: { date: Date, bookings: InstrumentUsage[] }[] = [];
    if (this.bookings) {
      this.bookings.results.forEach(booking => {
        const bookingDate = new Date(booking.created_at);
        bookingDate.setHours(0, 0, 0, 0);
        if (!this.instrumentMap[booking.instrument]) {
          this.web.getInstrumentPermission(booking.instrument).subscribe(usage => {
            this.dataService.instrumentPermissions[booking.instrument] = usage
          })
          this.instrumentMap[booking.instrument] = {} as Instrument;
          this.web.getInstrument(booking.instrument).subscribe((instrument: Instrument) => {
            this.instrumentMap[booking.instrument] = instrument;
          })
        }
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

  searchUser: OperatorFunction<string, any> = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term => this.web.getUsers(undefined, 10, 0, term).pipe(
        map((data: any) => data.results)
      ))
    );
  }

  searchInstrument: OperatorFunction<string, any> = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term => this.web.getInstruments(undefined, 10, 0, term).pipe(
        map((data: any) => data.results)
      ))
    );
  }

  formatter = (user: User) => user.username;

  selectUser(event: any): void {
    console.log(event)
    this.filterForm.controls['users'].setValue([...this.filterForm.value.users, event.item]);
  }

  removeUserFromFilter(user: User): void {
    this.filterForm.controls['users'].setValue(this.filterForm.value.users.filter((u: User) => u.username !== user.username));
  }

  selectInstrument(event: any): void {
    this.filterForm.controls['instrument'].setValue([...this.filterForm.value.instrument, event.item]);
  }

  removeInstrumentFromFilter(instrument: Instrument): void {
    this.filterForm.controls['instrument'].setValue(this.filterForm.value.instrument.filter((i: Instrument) => i.id !== instrument.id));
  }

  formatterInstrument = (instrument: Instrument) => instrument.instrument_name;

  toggleApproval(booking: InstrumentUsage): void {
    this.web.approveUsageToggle(booking.id).subscribe((result) => {
      if (this.bookings) {
        this.bookings.results = this.bookings.results.map((b) => {
          if (b.id === booking.id) {
            b.approved = !b.approved;
          }
          return b;
        });
      }
    })
  }
}
