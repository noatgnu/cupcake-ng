import { Component } from '@angular/core';
import {DataService} from "../data.service";
import {NgbCollapse, NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {LoginModalComponent} from "../login-modal/login-modal.component";
import {AccountsService} from "../accounts/accounts.service";
import {NgOptimizedImage} from "@angular/common";
import {Router} from "@angular/router";
import {QrcodeModalComponent} from "../qrcode-modal/qrcode-modal.component";
import {WebsocketService} from "../websocket.service";
import {WebService} from "../web.service";
import {WebrtcService} from "../webrtc.service";
import {WebrtcModalComponent} from "../webrtc-modal/webrtc-modal.component";
import {SessionEditorModalComponent} from "../protocol-session/session-editor-modal/session-editor-modal.component";
import {ToastService} from "../toast.service";
import {ProtocolCloneModalComponent} from "../protocol-clone-modal/protocol-clone-modal.component";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgOptimizedImage,
    NgbCollapse
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  isMenuCollapsed = true;
  switched = false

  constructor(private toastService: ToastService, private webrtc: WebrtcService, public dataService: DataService, private modal: NgbModal, public accounts: AccountsService, private router: Router, private ws: WebsocketService, private web: WebService) {
    this.accounts.triggerLoginSubject.subscribe(() => {
      this.openAccountLogin()})
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
        })
        this.dataService.triggerReload.next(true)
      }
    })
  }

  logout() {
    this.accounts.logout()
    this.ws.closeUserWS()
  }

  copyLink() {
    navigator.clipboard.writeText(location.origin + "/#/protocol-session/" + this.dataService.protocol?.id + "&" + this.dataService.currentSession?.unique_id)
  }

  goToProtocolEditor(protocolID: number) {
    const url = this.router.createUrlTree(["/protocol-editor", protocolID])
    window.open(location.origin + "/#/protocol-editor/" + protocolID, '_blank')
  }
  openQRCodeModal() {
    const ref = this.modal.open(QrcodeModalComponent)
    ref.componentInstance.url = location.origin + "/#/protocol-session/" + this.dataService.protocol?.id + "&" + this.dataService.currentSession?.unique_id
  }

  navigateToAccount() {
    this.router.navigate(["/accounts"])
  }

  exportToDocx(exportType: string, format: string) {
    let currentSession = ""
    if (this.dataService.currentSession) {
      currentSession = this.dataService.currentSession.unique_id
    }
    console.log(this.dataService.protocol)
    if (this.dataService.protocol) {
      if (exportType === "protocol") {
        this.web.exportToDocx(this.dataService.protocol.id, "", format).subscribe((data: any) => {
          this.toastService.show("Exporting Protocol", "Processing Request")
        })
      } else if (exportType === "session") {
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
  }
}
