import {Component, Input} from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {UserDataComponent} from "../accounts/user-data/user-data.component";
import {InstrumentBookingComponent} from "./instrument-booking/instrument-booking.component";
import {InstrumentManagementComponent} from "./instrument-management/instrument-management.component";
import {InstrumentJobManagementComponent} from "./instrument-job-management/instrument-job-management.component";

@Component({
    selector: 'app-instruments',
    imports: [
        ReactiveFormsModule,
        UserDataComponent,
        InstrumentBookingComponent,
        InstrumentManagementComponent,
        InstrumentJobManagementComponent
    ],
    templateUrl: './instruments.component.html',
    styleUrl: './instruments.component.scss'
})
export class InstrumentsComponent {
  @Input('section') set section(value: string) {
    this.selectedSection = value
  }
  @Input('id') set id(value: number) {
    this.currentJob = value
  }
  currentJob: number = -1

  selectedSection = 'jobs'
  hideSection = false
  constructor() {

  }

}
