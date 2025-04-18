import {Component, Input} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {ToastService} from "../../toast.service";
import { AccountsService } from '../accounts.service';

@Component({
    selector: 'app-signup',
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.scss'
})
export class SignupComponent {
  @Input() token: string = ""

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    confirmPassword: ['', Validators.required]
  })

  constructor(private fb: FormBuilder, private toastService: ToastService, private accountsService: AccountsService) {

  }

  onSubmit() {
    if (this.form.valid) {
      if (this.form.value.password !== this.form.value.confirmPassword) {
        this.toastService.show('Error', 'Passwords do not match');
      } else {
        if (this.token) {
          if (this.form.value.username && this.form.value.password) {
            this.accountsService.signUp(this.form.value.username, this.form.value.password, this.token).subscribe((data: any) => {
              this.toastService.show('Accounts', 'Account created successfully, please log in.');
            }, (error) => {
              this.toastService.show('Error', error.error);
            });
          }
        }
      }
    }
  }
}
