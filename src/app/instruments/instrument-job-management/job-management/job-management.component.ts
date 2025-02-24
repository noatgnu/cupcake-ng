import { Component } from '@angular/core';
import {WebService} from "../../../web.service";
import {InstrumentJobQuery} from "../../../instrument-job";

@Component({
  selector: 'app-job-management',
  standalone: true,
  imports: [],
  templateUrl: './job-management.component.html',
  styleUrl: './job-management.component.scss'
})
export class JobManagementComponent {
  instrumentJobQuery: InstrumentJobQuery|undefined
  constructor(private web: WebService) {
    this.web.getInstrumentJobs().subscribe(data => {
      this.instrumentJobQuery = data
    })
  }

}
