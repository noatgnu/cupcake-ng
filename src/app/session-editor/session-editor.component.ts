import {Component, Input} from '@angular/core';
import {WebService} from "../web.service";
import {ProtocolSession} from "../protocol-session";
import {DataService} from "../data.service";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {Protocol, ProtocolQuery} from "../protocol";
import {ProtocolListComponent} from "../protocol-list/protocol-list.component";
import {NgbCalendar, NgbDate, NgbDatepicker} from "@ng-bootstrap/ng-bootstrap";

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
      if (this.session.started_at) {
        this.fromDate = new NgbDate(this.session.started_at.getFullYear(), this.session.started_at.getMonth(), this.session.started_at.getDate());
      }
      if (this.session.ended_at) {
        this.toDate = new NgbDate(this.session.ended_at.getFullYear(), this.session.ended_at.getMonth(), this.session.ended_at.getDate());
      }
      this.web.getAssociatedProtocolTitles(value).subscribe((response) => {
        this.associatedProtocols = response;
      })
      if (this.fromDate) {
        this.calculateDatePreview()
      }
    })
  }

  get sessionID(): string {
    return this._sessionID;
  }

  constructor(private calendar: NgbCalendar, private web: WebService, private dataService: DataService, private fb: FormBuilder) {
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

}
