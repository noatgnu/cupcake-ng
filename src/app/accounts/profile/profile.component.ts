import {Component, OnInit} from '@angular/core';
import {AccountsService} from "../accounts.service";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {ToastService} from "../../toast.service";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

  form = this.fb.group(
    {
      first_name: ['',],
      last_name: ['',],
      email: ['', Validators.email],
    }
  )

  constructor(private toastService: ToastService, private accountService: AccountsService, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.accountService.getCurrentUser().subscribe((user) => {
      this.form.patchValue({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      })
    })
  }

  updateProfile() {
    if (this.form.invalid) {
      return
    }
    this.accountService.updateCurrentUser(this.form.value).subscribe((user) => {
      this.toastService.show('Profile Updated', 'Your profile has been updated.')
      this.form.patchValue({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      })
    }, (error) => {
      this.toastService.show('Profile Update Failed', 'There was an error updating your profile.')
      if (error.status === 409) {
        this.toastService.show('Profile Update Failed', 'Email already in use.')
      }
    })
  }
}
