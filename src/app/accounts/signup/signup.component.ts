import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {ToastService} from "../../toast.service";
import { AccountsService } from '../accounts.service';
import {NgClass} from "@angular/common";
import {RouterLink} from "@angular/router";

@Component({
    selector: 'app-signup',
  imports: [
    ReactiveFormsModule,
    NgClass,
    RouterLink
  ],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  @Input() token: string = ""

  form!: FormGroup;
  loading = false;
  submitted = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private accountsService: AccountsService,
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue]
    }, {
      validators: this.mustMatch('password', 'confirmPassword')
    });
  }

  get f() { return this.form.controls; }

  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    if (this.form.valid) {
      if (this.form.value.password !== this.form.value.confirmPassword) {
        this.toastService.show('Error', 'Passwords do not match');
      } else {
        if (this.token) {
          if (this.form.value.username && this.form.value.password) {
            this.accountsService.signUp(this.form.value.username, this.form.value.password, this.token).subscribe((data: any) => {
              this.toastService.show('Accounts', 'Account created successfully, please log in.');
              this.loading = false;
              }, (error:any) => {
              this.toastService.show('Error', error.error);
              this.loading = false;
            });
          }
        }
      }
    }
  }
}
