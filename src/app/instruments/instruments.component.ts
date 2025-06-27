import {Component, Input} from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {UserDataComponent} from "../accounts/user-data/user-data.component";
import {InstrumentBookingComponent} from "./instrument-booking/instrument-booking.component";
import {InstrumentManagementComponent} from "./instrument-management/instrument-management.component";
import {InstrumentJobManagementComponent} from "./instrument-job-management/instrument-job-management.component";
import {WebsocketService} from "../websocket.service";
import {WebService} from "../web.service";
import {NgClass} from "@angular/common";
import {SiteSettingsService} from "../site-settings.service";

@Component({
    selector: 'app-instruments',
    imports: [
      ReactiveFormsModule,
      UserDataComponent,
      InstrumentBookingComponent,
      InstrumentManagementComponent,
      InstrumentJobManagementComponent,
      NgClass
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
  constructor(private ws: WebsocketService, private web: WebService, public siteSettings: SiteSettingsService) {
    this.ws.connectInstrumentJobWS(this.web.cupcakeInstanceID)
  }

  hasFooterText(): boolean {
    const settings = this.siteSettings.getCurrentPublicSettings();
    return !!(settings?.footer_text && settings.footer_text.trim());
  }

}
