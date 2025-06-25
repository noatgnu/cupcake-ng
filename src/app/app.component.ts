import { Component } from '@angular/core';
import {NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet} from '@angular/router';
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
import {WebService} from "./web.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {DownloadModalComponent} from "./download-modal/download-modal.component";
import {LoadingIndicatorComponent} from "./loading-indicator/loading-indicator.component";
import {LoadingTrackerService} from "./loading-tracker.service";
import {AsyncPipe, NgClass, NgTemplateOutlet} from "@angular/common";
import {FloatingChatComponent} from "./chat/floating-chat/floating-chat.component";
import {FooterComponent} from "./footer/footer.component";
import {SiteSettingsService} from "./site-settings.service";
import {PublicSiteSettings} from "./site-settings";

@Component({
    selector: 'app-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    LoadingComponent,
    ToastContainerComponent,
    HandwrittenAnnotationComponent,
    LoadingIndicatorComponent,
    AsyncPipe,
    NgTemplateOutlet,
    NgClass,
    FloatingChatComponent,
    FooterComponent
  ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'cupcake-ng';
  ready = false;
  routerToast: any;
  loadingChunk = this.loadingTracker.loading$;
  currentSettings: PublicSiteSettings| undefined = undefined;

  constructor(private loadingTracker: LoadingTrackerService, private modal: NgbModal, private router: Router, private web: WebService, private accounts: AccountsService, public webrtc: WebrtcService, private ws: WebsocketService, private dataService: DataService, private toastService: ToastService, private siteSettings: SiteSettingsService) {
    this.siteSettings.publicSettings$.subscribe((data) => {
      this.title = data?.site_name || "Cupcake";
    })
    this.siteSettings.getPublicSettings().subscribe((data) => {})


    this.router.events.subscribe(async (event )=> {
      if (event instanceof NavigationStart) {
        this.routerToast = await this.toastService.show("Loading", "Loading page...", 0, "info", 30)
      } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.routerToast.progress = 100
        this.toastService.remove(this.routerToast);
        this.routerToast = undefined;
      }
    })
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
    this.web.getCSRFToken().subscribe(resp => {})

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

        this.web.getServerSettings().subscribe((data) => {
          if (data) {
            this.dataService.serverSettings = data
          }
        })
        this.web.getStaffStatus().subscribe((data) => {
          this.accounts.is_staff = data.is_staff
          console.log(data.is_staff)
        })
      }
    }
    console.log(this.accounts.token)
    this.ready = true
    this.ws.userWSConnection?.subscribe((data) => {
      if (data) {
        console.log(data)
        if ("signed_value" in data && "instance_id" in data) {
          if (data["instance_id"] === this.web.cupcakeInstanceID) {
            if (data["signed_value"].startsWith("reagent_actions_export")) {
              this.toastService.show("Export File", "Exporting file...")
              const downloadURL = environment.baseURL + "/api/storage_object/download_report/?token=" + data["signed_value"]
              const link = document.createElement('a');
              link.href = downloadURL;
              link.download = data["signed_value"].split(":")[0]
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }
        }

        /*if(data.signed_value && data.user_download) {
          this.toastService.show("Export File", "Downloading file...")
          const downloadURL = environment.baseURL + "/api/protocol/download_temp_file/?token=" + data.signed_value
          const link = document.createElement('a');
          link.href = downloadURL;
          link.download = data.signed_value.split(":")[0]
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          //window.open(environment.baseURL + "/api/protocol/download_temp_file/?token=" + data.signed_value, "_blank")
        }*/
      }
    })

    this.ws.summaryWSConnection?.subscribe((data) => {
      if (data) {
        if (data.target) {
          if (data.type === "step") {
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
          } else if (data.type === "annotation") {
            if (data.target.annotation) {
              if (!this.dataService.annotationCompletionSummary[data.target.annotation]) {
                this.toastService.show("Annotation", "Annotation summarization started")
                this.dataService.annotationCompletionSummary[data.target.annotation] = {started: false, completed: false, content: "", promptStarted: false}
              }

              if (data.data.startsWith("<|im_start|>assistant")) {
                this.dataService.annotationCompletionSummary[data.target.annotation] = {started: true, completed: false, content: "", promptStarted: true}
              } else {
                if (this.dataService.annotationCompletionSummary[data.target.annotation].promptStarted) {
                  this.dataService.annotationCompletionSummary[data.target.annotation].content += data.data
                  this.dataService.annotationCompletionSummary[data.target.annotation].completed = data.finished
                  if (data.finished) {
                    this.dataService.updateAnnotationSummary.next({annotationID: data.target.annotation, summary: this.dataService.annotationCompletionSummary[data.target.annotation].content})
                    this.dataService.annotationCompletionSummary[data.target.annotation].started = false
                    this.dataService.annotationCompletionSummary[data.target.annotation].promptStarted = false
                  }
                }
              }
            }
          }
        }
      }
    })
  }

  checkForPreferredTheme() {
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  }
}
