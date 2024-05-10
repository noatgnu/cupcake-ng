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
import {WebrtcService} from "./webrtc.service";
import {ToastService} from "./toast.service";

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
  constructor(private accounts: AccountsService, private webrtc: WebrtcService, private ws: WebsocketService, private dataService: DataService, private toastService: ToastService) {
    const followSystemTheme = localStorage.getItem("cupcake-follow-system-theme")
    if (followSystemTheme) {
      if (followSystemTheme === "true") {
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDarkMode) {
          this.dataService.setDarkMode(true)
        }
      }
    } else {
      const darkMode = localStorage.getItem("cupcake-dark-mode")
      if (darkMode && darkMode === "true") {
        this.dataService.setDarkMode(true)
      }
    }

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
          this.toastService.show("Export File", "Downloading file...")
          window.open(environment.baseURL + "/api/protocol/download_temp_file/?token=" + data.signed_value, "_blank")
        }
      }
    })
    this.ws.summaryWSConnection?.subscribe((data) => {
      if (data) {
        if (data.target) {
          if (data.target.step) {
            if (!this.dataService.stepCompletionSummary[data.target.step]) {
              this.dataService.stepCompletionSummary[data.target.step] = {started: false, completed: false, content: "", promptStarted: false}
            }
            if (data.data.startsWith("<|im_start|>assistant")) {
              this.dataService.stepCompletionSummary[data.target.step] = {started: true, completed: false, content: "", promptStarted: true}
            } else {
              if (this.dataService.stepCompletionSummary[data.target.step].promptStarted) {
                this.dataService.stepCompletionSummary[data.target.step].content += data.data
                this.dataService.stepCompletionSummary[data.target.step].completed = data.finished
                if (data.finished) {
                  this.dataService.stepCompletionSummary[data.target.step].started = false
                  this.dataService.stepCompletionSummary[data.target.step].promptStarted = false
                }
              }
            }
          }
        }
        console.log(data)
      }
    })
  }

  checkForPreferredTheme() {
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  }
}
