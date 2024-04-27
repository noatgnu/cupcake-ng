import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DatePipe} from "@angular/common";
import {Protocol} from "../protocol";
import {TimerService} from "../timer.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {RemovalAreYouSureComponent} from "./removal-are-you-sure/removal-are-you-sure.component";

@Component({
  selector: 'app-protocol-list',
  standalone: true,
  imports: [
    DatePipe
  ],
  templateUrl: './protocol-list.component.html',
  styleUrl: './protocol-list.component.scss'
})
export class ProtocolListComponent {
  _protocols: Protocol[] = []
  @Input() set protocols(value: Protocol[]) {
    this._protocols = value
    this.durationMap = {}
    value.forEach((protocol) => {
      this.durationMap[protocol.id] = 0
      protocol.sections.forEach((section) => {
        this.durationMap[protocol.id] += section.section_duration
      })

    })
  }
  get protocols(): Protocol[] {
    return this._protocols
  }
  durationMap: {[key: number]: number} = {}

  @Input() enableAdd: boolean = false
  @Input() enableRemove: boolean = false
  @Input() enableEdit: boolean = false
  @Output() removeProtocol: EventEmitter<number> = new EventEmitter<number>()
  @Output() addProtocol: EventEmitter<number> = new EventEmitter<number>()
  @Output() editProtocol: EventEmitter<number> = new EventEmitter<number>()
  constructor(public timeKeeper: TimerService, private modal: NgbModal) { }

  remove(id: number) {
    this.modal.open(RemovalAreYouSureComponent).result.then((result) => {
      if (result) {
        this.removeProtocol.emit(id)
      }
    })
  }

}
