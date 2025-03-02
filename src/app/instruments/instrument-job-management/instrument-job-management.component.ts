import {Component, Input} from '@angular/core';
import {NgbNav, NgbNavContent, NgbNavItem, NgbNavLinkButton, NgbNavOutlet} from "@ng-bootstrap/ng-bootstrap";
import {JobSubmissionComponent} from "./job-submission/job-submission.component";
import {WebService} from "../../web.service";
import {InstrumentJob} from "../../instrument-job";
import {JobManagementComponent} from "./job-management/job-management.component";

@Component({
    selector: 'app-instrument-job-management',
    imports: [
        NgbNavContent,
        NgbNavLinkButton,
        NgbNavItem,
        NgbNav,
        NgbNavOutlet,
        JobSubmissionComponent,
        JobManagementComponent
    ],
    templateUrl: './instrument-job-management.component.html',
    styleUrl: './instrument-job-management.component.scss'
})
export class InstrumentJobManagementComponent {
  private _currentJob: InstrumentJob|undefined
  @Input() set currentJobId(value: number) {
    if (value) {
      this.web.getInstrumentJob(value).subscribe((data) => {
        this._currentJob = data
      })
    }
  }

  set currentJob(value: InstrumentJob|undefined) {
    this._currentJob = value
  }

  get currentJob(): InstrumentJob|undefined {
    return this._currentJob
  }

  constructor(private web: WebService) {

  }
}
