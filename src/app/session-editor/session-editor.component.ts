import {Component, Input} from '@angular/core';
import {WebService} from "../web.service";
import {ProtocolSession} from "../protocol-session";
import {DataService} from "../data.service";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {Protocol, ProtocolQuery} from "../protocol";
import {ProtocolListComponent} from "../protocol-list/protocol-list.component";
import {NgbCalendar, NgbDate, NgbDatepicker} from "@ng-bootstrap/ng-bootstrap";
import {ToastService} from "../toast.service";
import {Router} from "@angular/router";
import {routes} from "../app.routes";

@Component({
  selector: 'app-session-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ProtocolListComponent,
    NgbDatepicker
  ],
  templateUrl: './session-editor.component.html',
  styleUrl: './session-editor.component.scss'
})
export class SessionEditorComponent {
  private _sessionID: string = '';
  session?: ProtocolSession;

  form = this.fb.group({
    enabled: false,
    name: "",
  })

  formSearch = this.fb.group({
    protocolSearch: "",
    searchTitle: true,
    searchDescription: true,
    searchSteps: true,
  })

  associatedProtocols: Protocol[] = []

  protocolSearchResults?: ProtocolQuery

  hoveredDate: NgbDate | null = null;
  fromDate: NgbDate | null = null;
  toDate: NgbDate | null = null;
  toDatePreview: NgbDate | null = null;

  @Input() set sessionID(value: string) {
    this._sessionID = value;

    this.web.getProtocolSession(value).subscribe((response) => {
      this.dataService.currentSession = response;
      this.session = response;
      console.log(response)
      this.refreshSessionAssociatedData(value);

    })
  }

  private refreshSessionAssociatedData(value: string) {
    if (!this.session) {
      return
    }
    if (this.session.started_at) {
      this.session.started_at = new Date(this.session.started_at)
      this.fromDate = new NgbDate(this.session.started_at.getFullYear(), this.session.started_at.getMonth()+1, this.session.started_at.getDate());
      console.log(this.fromDate)
    }
    if (this.session.ended_at) {
      this.session.ended_at = new Date(this.session.ended_at)
      this.toDate = new NgbDate(this.session.ended_at.getFullYear(), this.session.ended_at.getMonth()+1, this.session.ended_at.getDate());
    }
    this.web.getAssociatedProtocolTitles(value).subscribe((response) => {
      this.associatedProtocols = response;
      if (this.fromDate) {
        this.calculateDatePreview()
      }
    })
  }

  get sessionID(): string {
    return this._sessionID;
  }

  constructor(private router: Router, private calendar: NgbCalendar, private web: WebService, public dataService: DataService, private fb: FormBuilder, private toast: ToastService) {
    this.formSearch.controls.protocolSearch.valueChanges.subscribe((value) => {
      if (value) {
        if (value.length < 3) {
          this.web.searchProtocols("", value).subscribe((response) => {
            this.protocolSearchResults = response;
          })
        }
      }

    })
  }

  getProtocols(url: string) {
    // @ts-ignore
    this.web.searchProtocols(url, this.formSearch.controls.protocolSearch.value).subscribe((response) => {
      this.protocolSearchResults = response;
    })
  }

  isHovered(date: NgbDate) {
    return (
      this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate)
    );
  }

  isInside(date: NgbDate) {
    return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }

  isRange(date: NgbDate) {
    return (
      date.equals(this.fromDate) ||
      (this.toDate && date.equals(this.toDate)) ||
      this.isInside(date) ||
      this.isHovered(date)
    );
  }

  isInPreviewRange(date: NgbDate) {
    return (
      date.equals(this.fromDate) ||
      (this.toDatePreview && date.equals(this.toDatePreview)) ||
      (this.toDatePreview && date.after(this.fromDate) && date.before(this.toDatePreview))
    );
  }

  onDateSelection(date: NgbDate) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
      this.calculateDatePreview()
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
    } else {
      this.toDate = null;
      this.fromDate = date;
      this.calculateDatePreview()
    }
  }

  calculateDatePreview() {
    let totalDuration = 0;
    this.associatedProtocols.forEach((protocol) => {
      for (let section of protocol.sections) {
        totalDuration += section.section_duration
      }
    })
    //convert seconds to days
    totalDuration = Math.ceil(totalDuration / 86400);
    if (this.fromDate) {
      this.toDatePreview = this.calendar.getNext(this.fromDate, 'd', totalDuration);
    }
  }

  save() {
    let startDate: Date|null = null;
    console.log(this.fromDate)
    if (this.fromDate) {
      startDate = new Date(this.fromDate.year, this.fromDate.month-1, this.fromDate.day);
    }
    let endDate: Date|null = null;
    console.log(this.toDate)
    if (this.toDate) {
      endDate = new Date(this.toDate.year, this.toDate.month-1, this.toDate.day);
    }
    console.log(startDate)
    console.log(endDate)
    // @ts-ignore
    this.web.updateProtocolSession(this.sessionID, this.form.value.name, this.form.value.enabled, startDate, endDate).subscribe(() => {

    })
  }

  handleProtocolRemove(protocolID: number) {
    if (this.session?.protocols.includes(protocolID)) {
      this.web.sessionRemoveProtocol(this.sessionID, protocolID).subscribe((response) => {
        this.session = response;
      })
    }
    this.refreshSessionAssociatedData(this.sessionID)
  }

  handleProtocolAdd(protocolID: number) {
    if (this.session?.protocols.includes(protocolID)) {
      this.toast.show("Protocol", "Already Existed in Session")
      return
    }
    this.web.sessionAddProtocol(this.sessionID, protocolID).subscribe((response) => {
      this.session = response;
      this.refreshSessionAssociatedData(this.sessionID)
    })
  }

  removeSession() {
    this.web.deleteProtocolSession(this.sessionID).subscribe(() => {
      this.session = undefined;
      this.dataService.currentSession = null;
      this.router.navigate(["/"])
    })
  }


}
