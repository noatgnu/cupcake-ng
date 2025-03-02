import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../web.service";
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {ToastService} from "../../toast.service";

@Component({
    selector: 'app-user-viewer-modal',
    imports: [
        FormsModule,
        ReactiveFormsModule
    ],
    templateUrl: './user-viewer-modal.component.html',
    styleUrl: './user-viewer-modal.component.scss'
})
export class UserViewerModalComponent {
  _protocolId: number = 0
  @Input() set protocolId(value: number) {
    this._protocolId = value
    if (value === 0) {
      return
    }
    this.web.getProtocolViewers(this.protocolId).subscribe((data: any) => {
      this.viewers = data
    })
  }

  get protocolId(): number {
    return this._protocolId
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
    this.web.protocolAddUserRole(this.protocolId, this.form.value.username, 'viewer').subscribe((data: any) => {
      this.toastService.show("User", "Added")
      this.web.getProtocolViewers(this.protocolId).subscribe((data: any) => {
        this.viewers = data
        this.form.reset()
      })
    })
  }

  removeUserFromProtocol(username: string) {
    this.web.protocolRemoveUserRole(this.protocolId, username, 'viewer').subscribe((data: any) => {
      this.toastService.show("User", "Removed")
      this.web.getProtocolViewers(this.protocolId).subscribe((data: any) => {
        this.viewers = data
      })
    })
  }
}
