import {Component, Input} from '@angular/core';
import {DatePipe} from "@angular/common";
import {Protocol} from "../protocol";
import {TimerService} from "../timer.service";

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
  constructor(public timeKeeper: TimerService) { }

}
