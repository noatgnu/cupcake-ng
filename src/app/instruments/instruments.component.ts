import { Component } from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {UserDataComponent} from "../accounts/user-data/user-data.component";
import {InstrumentBookingComponent} from "./instrument-booking/instrument-booking.component";

@Component({
  selector: 'app-instruments',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    UserDataComponent,
    InstrumentBookingComponent
  ],
  templateUrl: './instruments.component.html',
  styleUrl: './instruments.component.scss'
})
export class InstrumentsComponent {
  selectedSection = 'bookings'


}
