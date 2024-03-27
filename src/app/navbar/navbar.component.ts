import { Component } from '@angular/core';
import {DataService} from "../data.service";
import {NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {LoginModalComponent} from "../login-modal/login-modal.component";
import {AccountsService} from "../accounts.service";
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgOptimizedImage
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  constructor(public dataService: DataService, private modal: NgbModal, public accounts: AccountsService) {
  }

  openAccountLogin() {
    const ref = this.modal.open(LoginModalComponent)
    ref.closed.subscribe((loginData) => {
      if (loginData) {
        this.accounts.login(loginData.username, loginData.password).subscribe((data: any) => {
          this.accounts.token = data.token
          this.accounts.loggedIn = true
          if (loginData.username) {
            this.accounts.username = loginData.username
          }

          if (loginData.remember && loginData.remember === true && loginData.username) {
            localStorage.setItem("cupcakeToken", data.token)
            localStorage.setItem("cupcakeUsername", loginData.username)
          }
        })
      }
    })
  }

  logout() {
    this.accounts.logout()
  }

  copyLink() {
    navigator.clipboard.writeText(location.origin + "/#/protocol-session/" + this.dataService.protocol?.id + "&" + this.dataService.currentSession?.unique_id)
  }
}
