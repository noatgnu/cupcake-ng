import { Component } from '@angular/core';
import {DataService} from "../data.service";
import {NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {LoginModalComponent} from "../login-modal/login-modal.component";
import {AccountsService} from "../accounts.service";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  constructor(public dataService: DataService, private modal: NgbModal, public accounts: AccountsService) {
  }

  openAccountLogin() {
    const ref = this.modal.open(LoginModalComponent)
    ref.closed.subscribe((data) => {
      if (data) {
        this.accounts.login(data.username, data.password).subscribe((data: any) => {
          this.accounts.token = data.token
          this.accounts.loggedIn = true
          if (data.username) {
            this.accounts.username = data.username
          }

          if (data.remember && data.remember === true && data.username) {
            localStorage.setItem("cupcakeToken", data.token)
            localStorage.setItem("cupcakeUsername", data.username)
          }
        })
      }
    })
  }

  logout() {
    this.accounts.logout()
  }
}
