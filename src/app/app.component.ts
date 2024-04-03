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
import {DataService} from "./data.service";

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
  constructor(private accounts: AccountsService, private ws: WebsocketService, private dataService: DataService) {

    if (this.accounts.token === "") {
      const token = localStorage.getItem("cupcakeToken")
      console.log(localStorage)
      if (token) {
        this.accounts.token = token
        this.accounts.loggedIn = true
        this.accounts.username = localStorage.getItem("cupcakeUsername") || ""
        this.accounts.loadLastVisited()
        this.ws.connectUserWS()
        this.ws.connectSummaryWS()
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
    this.ws.summaryWSConnection?.subscribe((data) => {
      if (data) {
        if (data.target) {
          if (data.target.step) {
            if (!this.dataService.stepCompletionSummary[data.target.step]) {
              this.dataService.stepCompletionSummary[data.target.step] = {started: false, completed: false, content: ""}
            }
            if (data.data.startsWith("llm-Answer:")) {
              this.dataService.stepCompletionSummary[data.target.step] = {started: true, completed: false, content: ""}
            } else {
              if (this.dataService.stepCompletionSummary[data.target.step].started) {
                this.dataService.stepCompletionSummary[data.target.step].content += data.data
                this.dataService.stepCompletionSummary[data.target.step].completed = data.finished
                if (data.finished) {
                  this.dataService.stepCompletionSummary[data.target.step].started = false
                }
              }
            }
          }
        }
        console.log(data)
      }
    })
  }
}
