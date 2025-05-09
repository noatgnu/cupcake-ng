import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnDestroy, ViewChild } from '@angular/core';
import { CameraService } from "../camera.service";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import Quagga from "@ericblade/quagga2";
import JsBarcode from "jsbarcode";
import { StorageObject, StoredReagentQuery } from "../storage-object";
import { WebService } from "../web.service";
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-barcode-scanner-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './barcode-scanner-modal.component.html',
  styleUrl: './barcode-scanner-modal.component.scss'
})
export class BarcodeScannerModalComponent implements AfterViewInit, OnDestroy {
  torchAvailable: boolean = false;
  torchEnabled: boolean = false;
  videoElementPreviewID: string = '#videoElementPreview';
  errorMessage: string = '';
  startedQR: boolean = false;
  lastScannedCode: string = '';
  lastScannedCodeDate: number | undefined = undefined;
  isLoading: boolean = false;
  scanningActive: boolean = false;
  manualEntryMode: boolean = false;
  availableCameras: MediaDeviceInfo[] = [];
  selectedCameraId: string | undefined;
  isSearching: boolean = false;

  detectionBuffer: Map<string, number> = new Map();
  minDetectionConfidence = 0.15;
  requiredDetectionCount = 3;
  detectionLocked = false;

  barcodeForm: FormGroup;
  lastDetectionTime = 0;
  detectionDebounceTime = 300;
  destroy$ = new Subject<void>();
  searchSubject = new BehaviorSubject<string>('');

  @Input() enableSearch: boolean = false;

  private _storageObject?: StorageObject|undefined = undefined;
  @Input() set storageObject(value: StorageObject|undefined) {
    this._storageObject = value;
  }

  get storageObject(): StorageObject|undefined {
    return this._storageObject;
  }

  storedReagentQuery?: StoredReagentQuery;



  constructor(
    private web: WebService,
    private camera: CameraService,
    private change: ChangeDetectorRef,
    private activeModal: NgbActiveModal,
    private fb: FormBuilder
  ) {
    this.barcodeForm = this.fb.group({
      manualBarcode: ['']
    });

    // Setup debounced search
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(code => {
      if (code && this.enableSearch) {
        this.performSearch(code);
      }
    });
  }

  ngAfterViewInit() {
    this.loadAvailableCameras();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopCamera();
  }

  @HostListener('window:beforeunload')
  onBeforeUnload() {
    this.stopCamera();
  }

  loadAvailableCameras() {
    this.isLoading = true;
    Quagga.CameraAccess.enumerateVideoDevices()
      .then((devices) => {
        this.camera.availableDevices = devices;
        this.availableCameras = devices;
        if (devices.length > 0) {
          const mainCam = this.getMainBarcodeScanningCamera(devices);
          this.selectedCameraId = mainCam?.deviceId;
        }
        this.isLoading = false;
        this.change.detectChanges();
      })
      .catch(err => {
        this.errorMessage = `Failed to access camera: ${err.message || 'Unknown error'}`;
        this.isLoading = false;
        this.change.detectChanges();
      });
  }

  toggleTorch() {
    if (!this.startedQR) return;

    const videoTrack = Quagga.CameraAccess.getActiveTrack();
    if (videoTrack) {
      try {
        const capabilities = videoTrack.getCapabilities() as any;

        // Check if torch is supported
        if (capabilities.torch) {
          this.torchEnabled = !this.torchEnabled;

          videoTrack.applyConstraints({
            advanced: [{ torch: this.torchEnabled } as any]
          }).catch(e => {
            console.error("Torch control error:", e);
            this.errorMessage = "Failed to control flashlight";
            this.torchEnabled = false;
            this.change.detectChanges();
          });
        }
      } catch (e) {
        console.error("Torch not supported:", e);
        this.errorMessage = "Flashlight not available on this device";
        this.change.detectChanges();
      }
    }
  }

  checkTorchCapability() {
    const videoTrack = Quagga.CameraAccess.getActiveTrack();
    if (videoTrack) {
      try {
        const capabilities = videoTrack.getCapabilities() as any;
        this.torchAvailable = !!capabilities.torch;
        this.change.detectChanges();
      } catch (e) {
        console.error("Could not check torch capability:", e);
        this.torchAvailable = false;
        this.change.detectChanges();
      }
    }
  }

  initiateCameraForQRScan() {
    if (this.startedQR) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.initializeScannerWithDevice(this.selectedCameraId)
      .then(() => {
        this.startedQR = true;
        this.scanningActive = true;
        this.isLoading = false;
        this.checkTorchCapability();
        this.change.detectChanges();

        Quagga.onProcessed(this.onProcessed.bind(this));
        Quagga.onDetected(this.onDetected.bind(this));

        Quagga.start();
      })
      .catch(err => {
        this.errorMessage = `Failed to initialize scanner: ${err.message || 'Unknown error'}`;
        this.isLoading = false;
        this.change.detectChanges();
      });
  }

  isKnownBackCameraLabel(label: string): boolean {
    const labelLowerCase = label.toLowerCase();
    return this.camera.environmentFacingCameraLabelStrings.some(str =>
      labelLowerCase.includes(str));
  }

  getMainBarcodeScanningCamera(devices: MediaDeviceInfo[]): MediaDeviceInfo | undefined {
    const backCameras = devices.filter(v => this.isKnownBackCameraLabel(v.label));
    const sortedBackCameras = backCameras.sort((a, b) => a.label.localeCompare(b.label));
    return sortedBackCameras.length > 0 ? sortedBackCameras[0] : undefined;
  }

  initializeScannerWithDevice(preferredDeviceId: string | undefined): Promise<void> {
    console.log(`Initializing Quagga scanner with device: ${preferredDeviceId || 'default'}`);

    const constraints: any = {
      // Add focus mode constraints
      focusMode: ['continuous', 'auto'],  // Prioritize continuous autofocus
      // Additional optional constraints that can help with scanning
      zoom: 1.0,
      exposureMode: 'continuous'
    };

    if (preferredDeviceId) {
      constraints.deviceId = preferredDeviceId;
    } else {
      constraints.facingMode = 'environment';
    }

    return Quagga.init({
      frequency: 10,
      inputStream: {
        type: 'LiveStream',
        constraints,
        area: {
          top: '20%',
          right: '10%',
          left: '10%',
          bottom: '20%'
        },
        target: document.querySelector(this.videoElementPreviewID) ?? undefined,

      },
      decoder: {
        readers: [
          'ean_reader',
          'code_128_reader',
          'ean_8_reader',
          'code_39_reader',
          'code_93_reader',
          'upc_reader',
          'upc_e_reader'
        ],
        multiple: false,
        debug: {
          drawBoundingBox: true,
          showFrequency: false,
          drawScanline: true,
          showPattern: false
        }
      },
      locate: true,
      locator: {
        halfSample: true,
        patchSize: "medium",
      }
    });
  }

  onProcessed(result: any) {
    const drawingCtx = Quagga.canvas.ctx.overlay;
    const drawingCanvas = Quagga.canvas.dom.overlay;

    if (result) {
      if (result.boxes) {
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        result.boxes.forEach((box: any) => {
          if (box !== result.box) {
            drawingCtx.strokeStyle = "green";
            drawingCtx.lineWidth = 2;
            drawingCtx.strokeRect(box.x, box.y, box.width, box.height);
          }
        });
      }

      if (result.box) {
        drawingCtx.strokeStyle = "blue";
        drawingCtx.lineWidth = 2;
        drawingCtx.strokeRect(result.box.x, result.box.y, result.box.width, result.box.height);
      }

      if (result.codeResult && result.codeResult.code) {
        drawingCtx.font = "24px Arial";
        drawingCtx.fillStyle = "red";
        drawingCtx.fillText(result.codeResult.code, 10, 100);
      }
    }
  }

  onDetected(result: any) {
    if (this.detectionLocked) return;

    const now = Date.now();
    if (now - this.lastDetectionTime < this.detectionDebounceTime) {
      return;
    }
    this.lastDetectionTime = now;

    if (result.codeResult && result.codeResult.code) {
      if (result.codeResult.confidence < this.minDetectionConfidence) {
        return;
      }

      this.processDetectedCode(result.codeResult.code, result.codeResult.format);
    }
  }

  processDetectedCode(code: string, format: string) {
    const currentCount = this.detectionBuffer.get(code) || 0;
    this.detectionBuffer.set(code, currentCount + 1);

    if ((this.detectionBuffer.get(code) ?? 0) >= this.requiredDetectionCount) {
      this.onBarcodeScanned(code, format);
      this.detectionBuffer.clear();
    }
  }

  onBarcodeScanned(code: string, format?: string) {
    console.log(`Barcode scanned: ${code} (${format || 'unknown format'})`);
    const now = new Date().getTime();

    if (code === this.lastScannedCode &&
      ((this.lastScannedCodeDate !== undefined) &&
        (now < this.lastScannedCodeDate + 2000))) {
      return;
    }

    console.log(this.lastScannedCode);
    this.lastScannedCode = code;
    this.lastScannedCodeDate = now;
    this.change.detectChanges();
    this.drawBarcode();

    if (this.enableSearch) {
      this.searchSubject.next(code);
    }
  }

  lockDetection() {
    this.detectionLocked = true;
  }

  unlockDetection() {
    this.detectionLocked = false;
    this.detectionBuffer.clear();
  }

  resetDetection() {
    this.detectionBuffer.clear();
    this.detectionLocked = false;
    this.lastScannedCode = '';
    this.lastScannedCodeDate = undefined;
    this.change.detectChanges();
  }

  close() {
    this.stopCamera();
    this.activeModal.dismiss();
  }

  accept() {
    this.stopCamera();
    this.activeModal.close({barcode: this.lastScannedCode});
  }

  toggleFocus() {
    if (!this.startedQR) return;

    const videoTrack = Quagga.CameraAccess.getActiveTrack();
    if (videoTrack) {
      try {
        const capabilities = videoTrack.getCapabilities() as any;

        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
          videoTrack.applyConstraints({
            advanced: [{ focusMode: 'continuous' } as any]
          }).catch(e => console.error("Focus error:", e));
        } else {
          videoTrack.applyConstraints({
            advanced: [{ focusMode: 'manual' } as any]
          }).then(() => {
            setTimeout(() => {
              videoTrack.applyConstraints({
                advanced: [{ focusDistance: 0.5 } as any]
              });
            }, 500);
          }).catch(e => console.error("Focus error:", e));
        }
      } catch (e) {
        console.error("Camera focus not supported:", e);
      }
    }
  }
  stopCamera() {
    if (this.startedQR) {
      Quagga.offDetected(this.onDetected);
      Quagga.offProcessed(this.onProcessed);
      Quagga.stop();
      this.startedQR = false;
      this.scanningActive = false;
    }
  }

  drawBarcode() {
    const canvas = document.getElementById('barcode-canvas') as HTMLOrSVGImageElement;
    if (this.lastScannedCode && canvas) {
      try {
        JsBarcode(canvas,
          this.lastScannedCode,
          {
            format: 'auto',
            width: 5,
            height: 100,
            margin: 50,
            displayValue: true,
            background: "#ffffff",
            lineColor: "#000000",
            fontSize: 16
          }
        );
      } catch (e) {
        console.error('Failed to render barcode:', e);
        this.renderFallbackText(canvas);
      }
    }
  }

  renderFallbackText(canvas: HTMLOrSVGImageElement) {
    const svgNS = "http://www.w3.org/2000/svg";

    while (canvas.firstChild) {
      canvas.removeChild(canvas.firstChild);
    }

    // Add text element
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", "50%");
    text.setAttribute("y", "50%");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-family", "monospace");
    text.setAttribute("font-size", "16px");
    text.textContent = this.lastScannedCode;

    canvas.appendChild(text);
  }

  performSearch(barcode: string) {
    if (!barcode || !this.enableSearch) return;

    this.isSearching = true;
    this.web.getStoredReagents(undefined, 10, 0, barcode, this.storageObject?.id)
      .pipe(finalize(() => this.isSearching = false))
      .subscribe({
        next: (data) => {
          this.storedReagentQuery = data;
          this.change.detectChanges();
        },
        error: (err) => {
          console.error('Search failed:', err);
          this.errorMessage = 'Failed to search for item.';
          this.change.detectChanges();
        }
      });
  }

  toggleManualEntry() {
    this.manualEntryMode = !this.manualEntryMode;
    if (this.manualEntryMode) {
      this.stopCamera();
    }
  }

  submitManualBarcode() {
    const code = this.barcodeForm.get('manualBarcode')?.value;
    if (code) {
      this.lastScannedCode = code;
      this.lastScannedCodeDate = new Date().getTime();
      this.drawBarcode();
      if (this.enableSearch) {
        this.searchSubject.next(code);
      }
    }
  }

  onCameraChange(event: any) {
    if (!event.target) {
      return
    }
    const deviceId = event.target.value;
    this.selectedCameraId = deviceId;
    if (this.startedQR) {
      this.stopCamera();
      setTimeout(() => this.initiateCameraForQRScan(), 300);
    }
  }

  copyToClipboard() {
    if (this.lastScannedCode) {
      navigator.clipboard.writeText(this.lastScannedCode)
        .then(() => {
          this.errorMessage = 'Copied to clipboard!';
          setTimeout(() => {
            if (this.errorMessage === 'Copied to clipboard!') {
              this.errorMessage = '';
              this.change.detectChanges();
            }
          }, 2000);
        })
        .catch(err => {
          this.errorMessage = 'Failed to copy to clipboard';
          console.error('Failed to copy:', err);
        });
    }
  }
}
