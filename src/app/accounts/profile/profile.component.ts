import {Component, OnInit} from '@angular/core';
import {AccountsService} from "../accounts.service";
import {FormBuilder, ReactiveFormsModule, Validators, FormGroup} from "@angular/forms";
import {ToastService} from "../../toast.service";
import {NgClass} from "@angular/common";

@Component({
    selector: 'app-profile',
    imports: [
        ReactiveFormsModule,
      NgClass
    ],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

  form!: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private toastService: ToastService,
    private accountsService: AccountsService
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.loading = true;
    this.accountsService.getCurrentUser().subscribe({
      next: (data:any) => {
        this.form.patchValue({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email
        });
        this.loading = false;
      },
      error: (error:any) => {
        this.toastService.show('Error', 'Failed to load profile');
        this.loading = false;
      }
    });
  }

  updateProfile(): void {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.accountsService.updateCurrentUser(this.form.value).subscribe({
      next: () => {
        this.toastService.show('Success', 'Profile updated successfully');
        this.loading = false;
      },
      error: (error:any) => {
        this.toastService.show('Error', error.error?.message || 'Failed to update profile');
        this.loading = false;
      }
    });
  }

  resetForm(): void {
    this.submitted = false;
    this.loadUserProfile();
  }
}
