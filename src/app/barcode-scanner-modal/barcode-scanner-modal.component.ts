import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {CameraService} from "../camera.service";
import {
  NgbActiveModal,
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLinkButton,
  NgbNavOutlet
} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import Quagga from "@ericblade/quagga2";
import JsBarcode from "jsbarcode";
import {StorageObject, StoredReagentQuery} from "../storage-object";
import {WebService} from "../web.service";

@Component({
  selector: 'app-barcode-scanner-modal',
  standalone: true,
  imports: [
    NgbNav,
    NgbNavContent,
    NgbNavLinkButton,
    ReactiveFormsModule,
    FormsModule,
    NgbNavItem,
    NgbNavOutlet
  ],
  templateUrl: './barcode-scanner-modal.component.html',
  styleUrl: './barcode-scanner-modal.component.scss'
})
export class BarcodeScannerModalComponent implements AfterViewInit{
  videoElementPreviewID: string = '#videoElementPreview'
  errorMessage: string = ''
  startedQR: boolean = false
  lastScannedCode: string = ''
  lastScannedCodeDate: number | undefined = undefined

  @Input() enableSearch: boolean = false

  private _storageObject?: StorageObject|undefined = undefined
  @Input() set storageObject(value: StorageObject|undefined) {
    this._storageObject = value
    if (value) {

    }
  }

  get storageObject(): StorageObject|undefined {
    return this._storageObject
  }

  storedReagentQuery?: StoredReagentQuery | undefined

  constructor(private web: WebService, private camera: CameraService, private change: ChangeDetectorRef, private activeModal: NgbActiveModal) {
  }

  ngAfterViewInit() {
    this.initiateCameraForQRScan()
  }

  initiateCameraForQRScan() {
    Quagga.CameraAccess.enumerateVideoDevices().then((devices) => {
      this.camera.availableDevices = devices
      if (this.camera.availableDevices.length > 0) {
        const mainCam = this.getMainBarcodeScanningCamera(this.camera.availableDevices)
        if (mainCam) {
          return this.initializeScannerWithDevice(mainCam.deviceId)
        }
      }
      return this.initializeScannerWithDevice(undefined)
    })
  }

  isKnownBackCameraLabel(label: string): boolean {
    const labelLowerCase = label.toLowerCase();
    return this.camera.environmentFacingCameraLabelStrings.some(str => {
      return labelLowerCase.includes(str);
    });
  }

  getMainBarcodeScanningCamera(devices: MediaDeviceInfo[]): MediaDeviceInfo | undefined {
    const backCameras = devices.filter(v => this.isKnownBackCameraLabel(v.label));
    const sortedBackCameras = backCameras.sort((a, b) => a.label.localeCompare(b.label));
    return sortedBackCameras.length > 0 ? sortedBackCameras[0] : undefined;
  }

  private initializeScannerWithDevice(preferredDeviceId: string | undefined): Promise<void> {
    console.log(`Initializing Quagga scanner...`);

    const constraints: MediaTrackConstraints = {};
    if (preferredDeviceId) {
      // if we have a specific device, we select that
      constraints.deviceId = preferredDeviceId;
    } else {
      // otherwise we tell the browser we want a camera facing backwards (note that browser does not always care about this)
      constraints.facingMode = 'environment';
    }

    return Quagga.init({

        inputStream: {
          type: 'LiveStream',
          constraints,
          area: { // defines rectangle of the detection/localization area
            top: '25%',    // top offset
            right: '10%',  // right offset
            left: '10%',   // left offset
            bottom: '25%'  // bottom offset
          },
          target: document.querySelector(this.videoElementPreviewID) ?? undefined
        },
        decoder: {
          readers: [
            //'code_128_reader',
            'ean_reader',
            //'ean_5_reader',
            //'ean_2_reader',
            //'ean_8_reader',
            //'code_39_reader',
            //'code_39_vin_reader',
            //'codabar_reader',
            //'upc_reader',
            //'upc_e_reader',
            //'i2of5_reader',
            //'2of5_reader',
            //'code_93_reader',
            //'code_32_reader'
          ],
          multiple: false,
          //debug: {
          //  drawBoundingBox: true,
          //  showFrequency: true,
          //  drawScanline: true,
          //  showPattern: true
          //}
        },
        locate: true,
        locator: {
          halfSample: false,
          patchSize: "medium",
          //debug: {
          //  showCanvas: true,
          //  showPatches: true,
          //  showFoundPatches: true,
          //  showSkeleton: true,
          // showLabels: true,
          //  showPatchLabels: true,
          //  showRemainingPatchLabels: true,
          //  boxFromPatches: {
          //    showTransformed: true,
          //    showTransformedBox: true,
          //    showBB: true
          //  }
          //}
        }
      },
      (err) => {
        if (err) {
          console.error(`Quagga initialization failed: ${err}`);
          this.errorMessage = `Initialization error: ${err}`;
          this.startedQR = false;
        } else {
          console.log(`Quagga initialization succeeded`);
          Quagga.start();
          this.startedQR = true;
          this.change.detectChanges();
          Quagga.onDetected((res) => {
            if (res.codeResult.code) {
              this.onBarcodeScanned(res.codeResult.code);
            }
          });
        }
      });
  }

  onBarcodeScanned(code: string) {
    console.log(`Barcode scanned: ${code}`);
    const now = new Date().getTime();
    if (code === this.lastScannedCode
      && ((this.lastScannedCodeDate !== undefined) && (now < this.lastScannedCodeDate + 1500))) {
      return;
    }

    this.lastScannedCode = code;
    this.lastScannedCodeDate = now;
    this.change.detectChanges();
    this.drawBarcode();
    if (this.enableSearch) {
      this.search();
    }
  }

  close() {
    Quagga.stop()
    this.activeModal.dismiss()
  }

  accept() {
    Quagga.stop()
    this.startedQR = false
    this.activeModal.close({barcode: this.lastScannedCode})
  }

  stopCamera() {
    Quagga.stop()
    this.startedQR = false
  }

  drawBarcode() {
    const canvas = document.getElementById('barcode-canvas') as HTMLOrSVGImageElement
    if (this.lastScannedCode) {
      JsBarcode(canvas,
        this.lastScannedCode,
        {
          format: 'EAN13',
          width: 5,  // Increase this value to make the barcode thicker
          height: 100,  // Decrease this value to make the barcode shorter
          margin: 50, displayValue: true}
      )
    }
  }

  search() {
    if (this.lastScannedCode && this.enableSearch){
      this.web.getStoredReagents(undefined, 10, 0, this.lastScannedCode, this.storageObject?.id).subscribe((data) => {
        this.storedReagentQuery = data
      })
    }
  }
}
