import {Component, Input} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../web.service";
import {ToastService} from "../../toast.service";

@Component({
    selector: 'app-session-user-editor-modal',
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './session-user-editor-modal.component.html',
    styleUrl: './session-user-editor-modal.component.scss'
})
export class SessionUserEditorModalComponent {
  _sessionId: string = ""
  @Input() set sessionId(value: string) {
    this._sessionId = value
    if (value === "") {
      return
    }
    this.web.getSessionEditors(this.sessionId).subscribe((data: any) => {
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
    this.web.sessionAddUserRole(this.sessionId, this.form.value.username, 'editor').subscribe((data: any) => {
      this.toastService.show("User", "Added")
      this.web.getSessionEditors(this.sessionId).subscribe((data: any) => {
        this.viewers = data
        this.form.reset()
      })
    })
  }

  removeUserFromSession(username: string) {
    this.web.sessionRemoveUserRole(this.sessionId, username, 'editor').subscribe((data: any) => {
      this.toastService.show("User", "Removed")
      this.web.getSessionEditors(this.sessionId).subscribe((data: any) => {
        this.viewers = data
      })
    })
  }
}
