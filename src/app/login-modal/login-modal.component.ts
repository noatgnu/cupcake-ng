import { Component } from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgbActiveModal, NgbAlert} from "@ng-bootstrap/ng-bootstrap";
import {NgClass} from "@angular/common";

@Component({
    selector: 'app-login-modal',
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgbAlert
  ],
    templateUrl: './login-modal.component.html',
    styleUrl: './login-modal.component.scss'
})
export class LoginModalComponent {
  hidePassword = true;
  isLoading = false;
  loginError: string|null = null;
  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    remember: [true,]
  })

  constructor(private fb: FormBuilder, private modal: NgbActiveModal) {
  }

  login() {
    if (this.form.valid) {
      this.modal.close(this.form.value);
    }
  }

  close() {
    this.modal.dismiss();
  }
}
