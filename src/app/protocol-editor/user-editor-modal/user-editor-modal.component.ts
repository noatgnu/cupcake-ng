import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../web.service";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {ToastService} from "../../toast.service";

@Component({
  selector: 'app-user-editor-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './user-editor-modal.component.html',
  styleUrl: './user-editor-modal.component.scss'
})
export class UserEditorModalComponent {
  _protocolId: number = 0
  @Input() set protocolId(value: number) {
    this._protocolId = value
    if (value === 0) {
      return
    }
    this.web.getProtocolEditors(this.protocolId).subscribe((data: any) => {
      this.editors = data
    })
  }

  get protocolId(): number {
    return this._protocolId
  }

  editors: {id: number, username: string}[] = []

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
    this.web.protocolAddUserRole(this.protocolId, this.form.value.username, 'editor').subscribe((data: any) => {
      this.toastService.show("User", "Added")
      this.web.getProtocolEditors(this.protocolId).subscribe((data: any) => {
        this.editors = data
        this.form.reset()

      })
    })
  }

  removeUserFromProtocol(username: string) {
    this.web.protocolRemoveUserRole(this.protocolId, username, 'editor').subscribe(() => {
      this.toastService.show("User", "Removed")
      this.web.getProtocolEditors(this.protocolId).subscribe((data: any) => {
        this.editors = data
      })
    })
  }
}
