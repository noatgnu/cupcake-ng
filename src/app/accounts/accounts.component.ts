import { Component } from '@angular/core';
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {ToastService} from "../toast.service";
import {WebService} from "../web.service";

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss'
})
export class AccountsComponent {

  passwordForm = this.fb.group({
    currentPassword: [''],
    newPassword: [''],
  })
  constructor(private fb: FormBuilder, private toastService: ToastService, private web: WebService) {

  }

  changePassword() {
    if (this.passwordForm.value.newPassword === "") {
      this.toastService.show("Password change", "New password cannot be empty")
      return
    }
    if (this.passwordForm.value.currentPassword === "") {
      this.toastService.show("Password change", "Current password cannot be empty")
      return
    }
    this.toastService.show("Password change", "Changing password...")
    console.log(this.passwordForm.value.currentPassword, this.passwordForm.value.newPassword)
    // @ts-ignore
    this.web.changeUserPassword(this.passwordForm.value.currentPassword, this.passwordForm.value.newPassword).subscribe((data: any) => {
      this.toastService.show("Password change", "Password changed successfully")
      this.passwordForm.reset()
    }, (error: any) => {
      this.toastService.show("Password change", "Password change failed")
    })

  }
}
