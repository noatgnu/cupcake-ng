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
  isMenuCollapsed = false;
  constructor(private webrtc: WebrtcService, public dataService: DataService, private modal: NgbModal, public accounts: AccountsService, private router: Router, private ws: WebsocketService, private web: WebService) {
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
        })
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

  exportToDocx() {
    let currentSession = ""
    if (this.dataService.currentSession) {
      currentSession = this.dataService.currentSession.unique_id
    }
    console.log(this.dataService.protocol)
    if (this.dataService.protocol) {
      this.web.exportToDocx(this.dataService.protocol.id, currentSession).subscribe((data: any) => {

      })
    }
  }

  async testWebRTC() {
    const ref = this.modal.open(WebrtcModalComponent)
  }
}
