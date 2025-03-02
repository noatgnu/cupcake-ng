import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {CameraService} from "../camera.service";
import {
  NgbActiveModal,
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLinkButton,
  NgbNavOutlet
} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";
import {NgOptimizedImage} from "@angular/common";

@Component({
    selector: 'app-camera-modal',
    imports: [
        FormsModule,
        NgbNav,
        NgbNavItem,
        NgbNavLinkButton,
        NgbNavContent,
        NgOptimizedImage,
        NgbNavOutlet
    ],
    templateUrl: './camera-modal.component.html',
    styleUrl: './camera-modal.component.scss'
})
export class CameraModalComponent implements AfterViewInit{
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>
  @ViewChild('canvasElement') canvasElement?: ElementRef<HTMLCanvasElement>
  activeTab: string = 'preview'
  result?: string|undefined
  constructor(public camera: CameraService, private activeModal: NgbActiveModal) {
  }

  ngAfterViewInit() {
    if (this.videoElement) {
      this.camera.initateCameraForPhoto(this.videoElement.nativeElement)
    }
  }

  capture() {
    if (this.videoElement && this.canvasElement) {
      // @ts-ignore
      this.result = this.camera.takePhoto(this.videoElement.nativeElement, this.canvasElement.nativeElement)
      this.activeTab = 'photo'
    }
  }

  submit() {
    if (this.result) {
      this.camera.stopCamera()
      this.activeModal.close(this.result)
    }
  }

  close() {
    this.camera.stopCamera()
    this.activeModal.dismiss()
  }

  changeDevice(event: any) {
    if (this.videoElement) {
      this.camera.changeDevice(this.videoElement.nativeElement)
    }
  }

  remove() {
    this.camera.stopCamera()
    this.activeModal.close({remove: true})
  }
}
