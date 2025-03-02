import {Component, Input} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../web.service";
import {ToastService} from "../../toast.service";

@Component({
    selector: 'app-session-user-viewer-modal',
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './session-user-viewer-modal.component.html',
    styleUrl: './session-user-viewer-modal.component.scss'
})
export class SessionUserViewerModalComponent {
  _sessionId: string = ""
  @Input() set sessionId(value: string) {
    this._sessionId = value
    if (value === "") {
      return
    }
    this.web.getSessionViewers(this.sessionId).subscribe((data: any) => {
      this.viewers = data
    })
  }

  get sessionId(): string {
    return this._sessionId
  }

  viewers: {id: number, username: string}[] = []

  form = this.fb.group({
    username: ['', Validators.required]
  })

  constructor(private activeModal: NgbActiveModal, private web: WebService, private fb: FormBuilder, private toastService: ToastService) {
  }

  close() {
    this.activeModal.dismiss()
  }

  save() {
    this.activeModal.close()
  }

  submit() {
    // @ts-ignore
    this.web.sessionAddUserRole(this.sessionId, this.form.value.username, 'viewer').subscribe((data: any) => {
      this.toastService.show("User", "Added")
      this.web.getSessionViewers(this.sessionId).subscribe((data: any) => {
        this.viewers = data
        this.form.reset()
      })
    })
  }

  removeUserFromSession(username: string) {
    this.web.sessionRemoveUserRole(this.sessionId, username, 'viewer').subscribe((data: any) => {
      this.toastService.show("User", "Removed")
      this.web.getSessionViewers(this.sessionId).subscribe((data: any) => {
        this.viewers = data
      })
    })
  }
}
