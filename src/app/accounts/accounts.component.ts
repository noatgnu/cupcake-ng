import { Component } from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {ToastService} from "../toast.service";
import {WebService} from "../web.service";
import {DataService} from "../data.service";
import {NgbDropdown, NgbDropdownMenu, NgbDropdownToggle} from "@ng-bootstrap/ng-bootstrap";
import {UserDataComponent} from "./user-data/user-data.component";
import {LabGroupComponent} from "./lab-group/lab-group.component";

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    UserDataComponent,
    LabGroupComponent
  ],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss'
})
export class AccountsComponent {
  selectedSection = 'security'

  passwordForm = this.fb.group({
    currentPassword: [''],
    newPassword: [''],
  })
  constructor(private fb: FormBuilder, private toastService: ToastService, private web: WebService, public dataService: DataService) {

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

  toggleDarkMode(event: any) {
    const body = document.getElementsByTagName('body')[0]
    if (event.target?.checked) {
      body.setAttribute('data-bs-theme', 'dark')
      body.classList.add('dark-theme')
      localStorage.setItem('cupcake-dark-mode', 'true')
      this.dataService.darkMode = true
    } else {
      body.setAttribute('data-bs-theme', 'light')
      body.classList.remove('dark-theme')
      localStorage.setItem('cupcake-dark-mode', 'false')
      this.dataService.darkMode = false
    }
  }

  followSystemTheme(event: any) {
    localStorage.setItem('cupcake-follow-system-theme', event.target.checked.toString())
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDarkMode) {
      document.getElementsByTagName('body')[0].setAttribute('data-bs-theme', 'dark')
      document.getElementsByTagName('body')[0].classList.add('dark-theme')
      this.dataService.darkMode = true
    }
  }



}
