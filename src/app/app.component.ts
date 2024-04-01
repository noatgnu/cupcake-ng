import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {NavbarComponent} from "./navbar/navbar.component";
import {AccountsService} from "./accounts/accounts.service";
import {LoadingComponent} from "./loading/loading.component";
import {ToastContainerComponent} from "./toast-container/toast-container.component";
import {
  HandwrittenAnnotationComponent
} from "./protocol-session/handwritten-annotation/handwritten-annotation.component";
import {WebsocketService} from "./websocket.service";
import {environment} from "../environments/environment";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, LoadingComponent, ToastContainerComponent, HandwrittenAnnotationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'cupcake-ng';
  ready = false;
  constructor(private accounts: AccountsService, private ws: WebsocketService) {

    if (this.accounts.token === "") {
      const token = localStorage.getItem("cupcakeToken")
      console.log(localStorage)
      if (token) {
        this.accounts.token = token
        this.accounts.loggedIn = true
        this.accounts.username = localStorage.getItem("cupcakeUsername") || ""
        this.accounts.loadLastVisited()
        this.ws.connectUserWS()
      }
    }
    console.log(this.accounts.token)
    this.ready = true
    this.ws.userWSConnection?.subscribe((data) => {
      if (data) {
        console.log(data)
        if(data.signed_value && data.user_download) {
          window.open(environment.baseURL + "/api/protocol/download_temp_file/?token=" + data.signed_value, "_blank")
        }
      }
    })
  }
}
