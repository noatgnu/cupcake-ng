import {Component, Input} from '@angular/core';
import {LabGroup} from "../../lab-group";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {
  NgbActiveModal,
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle
} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../web.service";
import {ToastService} from "../../toast.service";

@Component({
  selector: 'app-lab-user-creation-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownItem,
    NgbDropdownToggle
  ],
  templateUrl: './lab-user-creation-modal.component.html',
  styleUrl: './lab-user-creation-modal.component.scss'
})
export class LabUserCreationModalComponent {
  @Input() lab_group: LabGroup|undefined

  form = this.fb.group({
    email: ['', Validators.required],
  })
  sending = false

  constructor(private toastService: ToastService, private fb: FormBuilder, private modal: NgbActiveModal, private web: WebService) {

  }

  close() {
    this.modal.dismiss()
  }

  submit() {
    console.log('Form submitted', this.form.value)
  }

  generateToken() {
    if (this.form.valid) {
      let lab_group_id = null
      if (this.lab_group) {
        lab_group_id = this.lab_group.id
      }
      if (this.form.value.email && !this.sending) {
        this.sending = true
        this.web.generateSignupToken(this.form.value.email, lab_group_id).subscribe((data) => {
          this.toastService.show('Sign Up Token', 'A sign up token has been generated for ' + this.form.value.email)
          this.modal.close(data)
          this.sending = false
        })
      }
    }
  }

  generateTokenAndSendEmail() {
    if (this.form.valid) {
      let lab_group_id = null
      if (this.lab_group) {
        lab_group_id = this.lab_group.id
      }
      if (this.form.value.email && !this.sending) {
        this.sending = true
        this.web.generateSignupTokenAndSendEmail(this.form.value.email, lab_group_id).subscribe((data) => {
          this.toastService.show('Sign Up Token', 'A sign up token has been generated for ' + this.form.value.email + ' and an email has been sent.')
          this.modal.close(data)
          this.sending = false
        })
      }
    }
  }

}
