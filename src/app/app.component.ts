import { Component, HostListener } from '@angular/core';
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
import {AsyncPipe, NgClass, NgTemplateOutlet, TitleCasePipe} from "@angular/common";
import {FloatingChatComponent} from "./chat/floating-chat/floating-chat.component";
import {FooterComponent} from "./footer/footer.component";
import {RuntimeSplashComponent} from "./runtime-splash/runtime-splash.component";
import {SiteSettingsService} from "./site-settings.service";
import {PublicSiteSettings} from "./site-settings";
import {BehaviorSubject, Observable} from "rxjs";

@Component({
    selector: 'app-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    LoadingComponent,
    ToastContainerComponent,
    AsyncPipe,
    NgTemplateOutlet,
    FloatingChatComponent,
    FooterComponent,
    RuntimeSplashComponent,
    TitleCasePipe
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
  splashVisible = false;
  splashTheme = 'default';

  constructor(private loadingTracker: LoadingTrackerService, private modal: NgbModal, private router: Router, private web: WebService, private accounts: AccountsService, public webrtc: WebrtcService, private ws: WebsocketService, private dataService: DataService, private toastService: ToastService, private siteSettings: SiteSettingsService) {
    this.siteSettings.publicSettings$.subscribe((data) => {
      this.title = data?.site_name || "Cupcake";
      if (data) {
        this.siteSettings.applyThemeColors(data);
        this.siteSettings.updatePageBranding(data);
      }
    })
    this.siteSettings.getPublicSettings().subscribe((data) => {
      if (data) {
        this.siteSettings.applyThemeColors(data);
        this.siteSettings.updatePageBranding(data);
      }
    })


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
    console.log("Follow system theme:", followSystemTheme)
    if (followSystemTheme) {
      console.log("Follow system theme is set to:", followSystemTheme)
      if (followSystemTheme === "true") {
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDarkMode) {
          this.dataService.setDarkMode(true)
        }
        console.log("Preferred dark mode:", prefersDarkMode)
      }
    } else {
      console.log("Follow system theme not set, checking local storage for dark mode")
      const darkMode = localStorage.getItem("cupcake-dark-mode")
      console.log("Dark mode from local storage:", darkMode)
      if (darkMode && darkMode === "true") {
        this.dataService.setDarkMode(true)
      }
      console.log(darkMode)
    }

    this.web.getCSRFToken().subscribe(resp => {})

    // Listen for custom splash screen activation events
    window.addEventListener('toggle-splash-screen', (event: any) => {
      if (event.detail) {
        if (event.detail.theme) {
          this.splashTheme = event.detail.theme;
        }
        if (event.detail.show) {
          this.splashVisible = true;
          this.toastService.show('Splash Screen', 'Press Ctrl+Alt+S, Esc, or click anywhere to close', 3000);
        } else {
          this.toggleSplashScreen();
        }
      }
    });

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

        // Wait for both server settings and staff status before setting ready
        let serverSettingsLoaded = false;
        let staffStatusLoaded = false;

        const checkIfReady = () => {
          if (serverSettingsLoaded && staffStatusLoaded) {
            this.ready = true;
            // Signal that app is ready
            (window as any)._appStarted = true;
            window.dispatchEvent(new CustomEvent('angular-app-ready'));
          }
        };

        // Update loading progress with meaningful messages
        (window as any).angularAppProgress?.('Establishing server connection...');
        const serverSettings$: Observable<any> = this.web.getServerSettings();
        serverSettings$.subscribe((data) => {
          if (data) {
            this.dataService.serverSettings = data
          }
          serverSettingsLoaded = true;
          (window as any).angularAppProgress?.('Loading user session...');
          checkIfReady();
        });

        (window as any).angularAppProgress?.('Authenticating user permissions...');
        this.web.getStaffStatus().subscribe((data) => {
          this.accounts.is_staff = data.is_staff
          console.log(data.is_staff)
          staffStatusLoaded = true;
          (window as any).angularAppProgress?.('Finalizing application setup...');
          checkIfReady();
        })
      } else {
        // No token found, user is not logged in - app is ready
        this.ready = true;
        (window as any)._appStarted = true;
        window.dispatchEvent(new CustomEvent('angular-app-ready'));
      }
    } else {
      // Token already exists, app is ready
      this.ready = true;
      (window as any)._appStarted = true;
      window.dispatchEvent(new CustomEvent('angular-app-ready'));
    }
    console.log(this.accounts.token)
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

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Toggle splash screen with Ctrl+Alt+S
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.toggleSplashScreen();
    }
  }

  toggleSplashScreen() {
    if (!this.ready) {
      this.toastService.show('Splash Screen', 'Please wait for application to finish loading', 2000);
      return;
    }

    if (!this.splashVisible) {
      // Get saved theme or use random
      const savedTheme = localStorage.getItem('cupcake-splash-theme');
      if (savedTheme && savedTheme !== 'random') {
        this.splashTheme = savedTheme;
      } else {
        // Use safe themes for random selection
        const safeThemes = ['default', 'scifi', 'space'];
        this.splashTheme = safeThemes[Math.floor(Math.random() * safeThemes.length)];
      }
    }

    this.splashVisible = !this.splashVisible;

    if (this.splashVisible) {
      this.toastService.show('Splash Screen', 'Press Ctrl+Alt+S, Esc, or click anywhere to close', 3000);
    }
  }

  onSplashClose() {
    this.splashVisible = false;
  }

  checkForPreferredTheme() {
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  }
}
