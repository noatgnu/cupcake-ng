import {Component, Input} from '@angular/core';
import {ProtocolSession} from "../../protocol-session";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-session-editor-modal',
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './session-editor-modal.component.html',
    styleUrl: './session-editor-modal.component.scss'
})
export class SessionEditorModalComponent {
  _session?: ProtocolSession
  @Input() set session(value: ProtocolSession) {
    this._session = value
    this.form.patchValue({
      enabled: value.enabled,
      name: value.name
    })
  }

  get session(): ProtocolSession {
    return this._session!
  }

  form = this.fb.group({
    enabled: false,
    name: '',

  })

  constructor(private fb: FormBuilder, private activeModal: NgbActiveModal) {
  }

  close() {
    this.activeModal.dismiss()
  }

  save() {
    this.activeModal.close(this.form.value)
  }
}
