import { Component } from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {UserDataComponent} from "../accounts/user-data/user-data.component";
import {InstrumentBookingComponent} from "./instrument-booking/instrument-booking.component";
import {InstrumentManagementComponent} from "./instrument-management/instrument-management.component";

@Component({
  selector: 'app-instruments',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    UserDataComponent,
    InstrumentBookingComponent,
    InstrumentManagementComponent
  ],
  templateUrl: './instruments.component.html',
  styleUrl: './instruments.component.scss'
})
export class InstrumentsComponent {
  selectedSection = 'bookings'
  hideSection = false
  constructor() { }

}
