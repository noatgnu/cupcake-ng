import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {NavbarComponent} from "./navbar/navbar.component";
import {AccountsService} from "./accounts.service";
import {LoadingComponent} from "./loading/loading.component";
import {ToastContainerComponent} from "./toast-container/toast-container.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, LoadingComponent, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'cupcake-ng';
  ready = false;
  constructor(private accounts: AccountsService) {

    if (this.accounts.token === "") {
      const token = localStorage.getItem("cupcakeToken")
      console.log(localStorage)
      if (token) {
        this.accounts.token = token
        this.accounts.loggedIn = true
        this.accounts.username = localStorage.getItem("cupcakeUsername") || ""
        this.accounts.loadLastVisited()
      }
    }
    console.log(this.accounts.token)
    this.ready = true
  }
}
