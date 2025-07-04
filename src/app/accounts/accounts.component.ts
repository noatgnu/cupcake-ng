import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {ToastService} from "../toast.service";
import {WebService} from "../web.service";
import {DataService} from "../data.service";
import {NgbDropdown, NgbDropdownMenu, NgbDropdownToggle} from "@ng-bootstrap/ng-bootstrap";
import {UserDataComponent} from "./user-data/user-data.component";
import {LabGroupComponent} from "./lab-group/lab-group.component";
import {AccountsService} from "./accounts.service";
import {SignupComponent} from "./signup/signup.component";
import {ProfileComponent} from "./profile/profile.component";
import {FavouritesComponent} from "./favourites/favourites.component";
import {NgClass} from "@angular/common";
import {MessagingComponent} from "../messaging/messaging.component";
import {ActivatedRoute, Router} from "@angular/router";
import {UserStatisticsComponent} from "./user-statistics/user-statistics.component";
import {UserSearchComponent} from "./user-search/user-search.component";
import {UserDashboardComponent} from "./user-dashboard/user-dashboard.component";
import {UserManagementComponent} from "./user-management/user-management.component";
import {ImportTrackingSummaryComponent} from "./import-tracking-summary/import-tracking-summary.component";

@Component({
    selector: 'app-accounts',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    UserDataComponent,
    LabGroupComponent,
    SignupComponent,
    ProfileComponent,
    FavouritesComponent,
    NgClass,
    MessagingComponent,
    UserStatisticsComponent,
    UserSearchComponent,
    UserDashboardComponent,
    UserManagementComponent,
    ImportTrackingSummaryComponent
  ],
    templateUrl: './accounts.component.html',
    styleUrl: './accounts.component.scss'
})
export class AccountsComponent implements OnInit{
  selectedSection = 'security'
  hideSidebar: boolean = false
  @Input() set section(value: string) {
    this.selectedSection = value
  }

  @Input() token: string = ""

  passwordForm = this.fb.group({
    currentPassword: [''],
    newPassword: [''],
  })
  constructor(private route: ActivatedRoute, private fb: FormBuilder, private toastService: ToastService, private web: WebService, public dataService: DataService, public accountService: AccountsService) {
    if (!accountService.loggedIn) {
      this.toastService.show("Accounts", "Please log in or sign up to access this page")
      this.selectedSection = 'signup'
    }
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['section']) {
        this.selectedSection = params['section']
      }
    })
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
      localStorage.removeItem('cupcake-dark-mode')
      this.dataService.darkMode = false
    }
    console.log(localStorage.getItem("cupcake-dark-mode"))
  }

  followSystemTheme(event: any) {
    console.log(event.target.checked.toString())
    if (event.target.checked) {
      localStorage.setItem('cupcake-follow-system-theme', event.target.checked.toString())
    } else {
      localStorage.removeItem('cupcake-follow-system-theme')
    }
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDarkMode) {
      document.getElementsByTagName('body')[0].setAttribute('data-bs-theme', 'dark')
      document.getElementsByTagName('body')[0].classList.add('dark-theme')
      this.dataService.darkMode = true
    }
  }
}
