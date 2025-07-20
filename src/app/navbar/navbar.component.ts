import {Component, OnInit} from '@angular/core';
import {DataService} from "../data.service";
import {NgbCollapse, NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {LoginModalComponent} from "../login-modal/login-modal.component";
import {AccountsService} from "../accounts/accounts.service";
import {NgOptimizedImage, SlicePipe} from "@angular/common";
import {Router, RouterLink} from "@angular/router";
import {QrcodeModalComponent} from "../qrcode-modal/qrcode-modal.component";
import {WebsocketService} from "../websocket.service";
import {WebService} from "../web.service";
import {WebrtcService} from "../webrtc.service";
import {WebrtcModalComponent} from "../webrtc-modal/webrtc-modal.component";
import {SessionEditorModalComponent} from "../protocol-session/session-editor-modal/session-editor-modal.component";
import {ToastService} from "../toast.service";
import {ProtocolCloneModalComponent} from "../protocol-clone-modal/protocol-clone-modal.component";
import {DownloadModalComponent} from "../download-modal/download-modal.component";
import {WebsocketStatusModalComponent} from "../websocket-status-modal/websocket-status-modal.component";
import {MessageService} from "../message.service";
import {Subscription} from "rxjs";
import {SiteSettingsService} from "../site-settings.service";

@Component({
    selector: 'app-navbar',
  imports: [
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgOptimizedImage,
    NgbCollapse,
    SlicePipe,
    RouterLink
  ],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  isMenuCollapsed = true;
  switched = false;
  unreadAlertCount = 0;
  title = "CUPCAKE";

  constructor(private messageService: MessageService, private toastService: ToastService, private webrtc: WebrtcService, public dataService: DataService, private modal: NgbModal, public accounts: AccountsService, private router: Router, private ws: WebsocketService, private web: WebService, private siteSettings: SiteSettingsService) {
    this.siteSettings.publicSettings$.subscribe(publicSettings => {
      if (publicSettings) {
        this.title = publicSettings.site_name
      }
    })
    this.accounts.triggerLoginSubject.subscribe(() => {
      this.openAccountLogin()
    })
  }

  ngOnInit() {
    this.messageService.getThreads({unread:true}).subscribe((messages) => {
      this.unreadAlertCount = messages.count
    })
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
          this.ws.connectUserWS()
          this.web.getServerSettings().subscribe((data) => {
            if (data) {
              this.dataService.serverSettings = data
            }
          })
          this.dataService.triggerReload.next(false)
        })

      }
    })
  }

  logout() {
    this.accounts.logout()
    this.ws.closeUserWS()
  }

  copyLink() {
    if (this.dataService.currentSession) {
      navigator.clipboard.writeText(location.origin + "/#/protocol-session/" + this.dataService.protocol?.id + "/session/" + this.dataService.currentSession?.unique_id)
    } else {
      navigator.clipboard.writeText(location.origin + "/#/protocol-session/" + this.dataService.protocol?.id)
    }
  }

  goToProtocolEditor(protocolID: number) {
    const url = this.router.createUrlTree(["/protocol-editor", protocolID])
    window.open(location.origin + "/#/protocol-editor/" + protocolID, '_blank')
  }
  openQRCodeModal() {
    const ref = this.modal.open(QrcodeModalComponent)
    if (this.dataService.currentSession) {
      ref.componentInstance.url = location.origin + "/#/protocol-session/" + this.dataService.protocol?.id + "/session/" + this.dataService.currentSession?.unique_id
    } else {
      ref.componentInstance.url = location.origin + "/#/protocol-session/" + this.dataService.protocol?.id
    }
  }

  navigateToAccount(location: string) {
    this.router.navigate([location])
  }

  exportToDocx(exportType: string, format: string) {
    let currentSession = ""
    if (this.dataService.currentSession) {
      currentSession = this.dataService.currentSession.unique_id
    }
    console.log(this.dataService.protocol)
    if (this.dataService.protocol) {
      this.modal.open(DownloadModalComponent)
      if (exportType === "protocol") {
        this.web.exportToDocx(this.dataService.protocol.id, "", format).subscribe((data: any) => {
          this.toastService.show("Exporting Protocol", "Processing Request")
        })
      } else if (exportType === "session") {
        this.web.exportToDocx(this.dataService.protocol.id, currentSession, format).subscribe((data: any) => {
          this.toastService.show("Exporting Session", "Processing Request")
        })
      } else if (exportType === "session-sqlite") {
        this.web.exportToDocx(this.dataService.protocol.id, currentSession, format).subscribe((data: any) => {
          this.toastService.show("Exporting Session", "Processing Request")
        })
      }

    }
  }

  async testWebRTC() {
    const ref = this.modal.open(WebrtcModalComponent, {scrollable: true, size: 'lg'})
  }

  openSessionEditor() {
    const ref = this.modal.open(SessionEditorModalComponent)
    ref.componentInstance.session = this.dataService.currentSession
    ref.closed.subscribe((data) => {
      if (data) {
        // @ts-ignore
        this.web.updateProtocolSession(this.dataService.currentSession!.unique_id, data.name, data.enabled).subscribe((response) => {
          this.dataService.currentSession = response
        })
      }
    })
  }

  switchTitle() {
    this.switched = !this.switched
  }

  openCloneModal() {
    const ref = this.modal.open(ProtocolCloneModalComponent)
    ref.componentInstance.protocol = this.dataService.protocol
    ref.closed.subscribe((data)=> {

    })
  }

  openWebsocketStatusModal() {
    const ref = this.modal.open(WebsocketStatusModalComponent)
  }

  // Check if a module is enabled based on site settings
  isModuleEnabled(moduleName: string): boolean {
    const settings = this.siteSettings.getCurrentPublicSettings();
    if (!settings) return true; // Default to enabled if settings not loaded
    
    switch (moduleName) {
      case 'documents':
        return settings.enable_documents_module !== false;
      case 'lab_notebook':
        return settings.enable_lab_notebook_module !== false;
      case 'instruments':
        return settings.enable_instruments_module !== false;
      case 'storage':
        return settings.enable_storage_module !== false;
      case 'billing':
        return settings.enable_billing_module !== false;
      case 'ai_sdrf_suggestions':
        return settings.enable_ai_sdrf_suggestions !== false;
      case 'backup':
        return settings.enable_backup_module !== false;
      default:
        return true;
    }
  }
}
