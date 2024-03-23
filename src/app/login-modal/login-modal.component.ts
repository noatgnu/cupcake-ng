import { Component } from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.scss'
})
export class LoginModalComponent {

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    remember: [false,]
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
