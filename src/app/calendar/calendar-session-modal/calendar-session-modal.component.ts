import {Component, Input} from '@angular/core';
import {ProtocolSession} from "../../protocol-session";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {DatePipe, NgClass} from "@angular/common";

@Component({
    selector: 'app-calendar-session-modal',
    imports: [
        DatePipe,
        NgClass
    ],
    templateUrl: './calendar-session-modal.component.html',
    styleUrl: './calendar-session-modal.component.scss'
})
export class CalendarSessionModalComponent {
  @Input() sessions: ProtocolSession[] = []

  hoveredSession?: ProtocolSession

  constructor(private activeModal: NgbActiveModal) {

  }

  close() {
    this.activeModal.dismiss()
  }

  handleClick(session: ProtocolSession) {
    const url = "#/protocol-session/" + session.protocols[0] + "&" + session.unique_id
    window.open(url, '_blank')
  }


}
