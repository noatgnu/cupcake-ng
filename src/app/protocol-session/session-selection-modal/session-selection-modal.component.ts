import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {ProtocolSession} from "../../protocol-session";
import {FormBuilder, FormControl, ReactiveFormsModule} from "@angular/forms";
import {WebService} from "../../web.service";
import {DatePipe} from "@angular/common";

@Component({
    selector: 'app-session-selection-modal',
    imports: [
        ReactiveFormsModule,
        DatePipe
    ],
    templateUrl: './session-selection-modal.component.html',
    styleUrl: './session-selection-modal.component.scss'
})
export class SessionSelectionModalComponent implements OnInit{
  @Input() associatedSessions: ProtocolSession[] = []
  @Input() protocolId: string = ''

  form = this.fb.group({
    selectedSession: new FormControl<ProtocolSession|null>(null)
  })

  constructor(private modal: NgbActiveModal, private fb: FormBuilder, private web: WebService) {

  }

  ngOnInit() {
  }

  submit() {
    if (!this.form.value.selectedSession) {
      return
    }
    this.modal.close(this.form.value.selectedSession)
  }

  createSession() {
    this.web.createSession([this.protocolId]).subscribe((session: ProtocolSession) => {
      this.modal.close(session)
    })
  }

  close() {
    this.modal.dismiss()
  }


}
