import {AfterViewInit, ChangeDetectorRef, Component, Input, NgZone, OnInit} from '@angular/core';
import {StoredReagent} from "../../storage-object";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {
  NgbActiveModal,
  NgbDateStruct, NgbHighlight,
  NgbInputDatepicker, NgbPagination,
  NgbTooltip,
  NgbTypeahead,
  NgbTypeaheadSelectItemEvent
} from "@ng-bootstrap/ng-bootstrap";
import JsBarcode from "jsbarcode";
import {debounceTime, filter, map, Observable, of, switchMap} from "rxjs";
import {SubcellularLocation} from "../../subcellular-location";
import {HumanDisease} from "../../human-disease";
import {Tissue} from "../../tissue";
import {Species} from "../../species";
import {MsVocab} from "../../ms-vocab";
import {WebService} from "../../web.service";
import {MetadataColumn} from "../../metadata-column";
import {Project} from "../../project";
import {Protocol, ProtocolStep} from "../../protocol";
import {ProtocolSession} from "../../protocol-session";
import {Unimod} from "../../unimod";
import {ItemMetadataComponent} from "../../item-metadata/item-metadata.component";
import {NgClass} from "@angular/common";

@Component({
    selector: 'app-stored-reagent-editor-modal',
    imports: [
        ReactiveFormsModule,
        NgbTypeahead,
        NgbInputDatepicker,
        FormsModule,
        NgbHighlight,
        ItemMetadataComponent,
        NgbPagination,
        NgClass,
      FormsModule
    ],
    templateUrl: './stored-reagent-editor-modal.component.html',
    styleUrl: './stored-reagent-editor-modal.component.scss'
})
export class StoredReagentEditorModalComponent implements AfterViewInit, OnInit{
  barcodeFormats = [
    {value: 'CODE128', label: 'CODE 128 (Auto)'},
    {value: 'CODE128A', label: 'CODE 128 A'},
    {value: 'CODE128B', label: 'CODE 128 B'},
    {value: 'CODE128C', label: 'CODE 128 C'},
    {value: 'EAN13', label: 'EAN-13'},
    {value: 'EAN8', label: 'EAN-8'},
    {value: 'UPC', label: 'UPC-A'},
    {value: 'UPCE', label: 'UPC-E'},
    {value: 'CODE39', label: 'CODE 39'},
    {value: 'ITF14', label: 'ITF-14'},
    {value: 'MSI', label: 'MSI'},
    {value: 'pharmacode', label: 'Pharmacode'},
    {value: 'codabar', label: 'Codabar'}
  ];
  selectedBarcodeFormat = 'EAN13';
  private _storedReagent: StoredReagent|undefined = undefined
  createdByProject!: Project
  createdBySession!: ProtocolSession
  createdByProtocol!: Protocol
  createdByStep!: ProtocolStep
  stepList: ProtocolStep[] = []
  page = 1;
  pageSize = 5;
  paginatedSteps: ProtocolStep[] = []
  hoveredStep: ProtocolStep|undefined = undefined

  formAutocomplete = this.fb.group({
    projectName: new FormControl(''),
    protocolName: new FormControl(''),
    sessionName: new FormControl(''),
    step: new FormControl('')
  })

  @Input() set storedReagent(value: StoredReagent|undefined) {
    this._storedReagent = value
    if (value) {
      this.form.controls.quantity.setValue(value.quantity)
      this.form.controls.notes.setValue(value.notes)
      this.form.controls.barcode.setValue(value.barcode)
      this.form.controls.shareable.setValue(value.shareable)
      this.form.controls.access_all.setValue(value.access_all)
      if (value.expiration_date) {
        const da = new Date(value.expiration_date)
        const ngbDateStruct = {
          year: da.getFullYear(),
          month: da.getMonth() + 1,
          day: da.getDate()
        }
        this.form.controls.expiration_date.setValue(ngbDateStruct)
      }
      if (value.created_by_project) {
        this.getProject(value.created_by_project)
        this.form.controls.created_by_project.setValue(value.created_by_project)
      }
      if (value.created_by_protocol) {
        this.getProtocol(value.created_by_protocol)
        this.form.controls.created_by_protocol.setValue(value.created_by_protocol)
      }
      if (value.created_by_session) {
        this.getSession(value.created_by_session)
      }
      if (value.created_by_step) {
        this.form.controls.created_by_step.setValue(value.created_by_step.id)
      }
      if (value.low_stock_threshold) {
        this.form.controls.lowStockThreshold.setValue(value.low_stock_threshold)
      }
      if (value.notify_on_low_stock !== undefined && value.notify_on_low_stock !== null) {
        this.form.controls.lowStockNotification.setValue(value.notify_on_low_stock)
      }
    }
  }

  get storedReagent(): StoredReagent|undefined {
    return this._storedReagent
  }

  form = this.fb.group({
    quantity: new FormControl(0),
    notes: new FormControl(''),
    barcode: new FormControl(''),
    shareable: new FormControl(true),
    access_all: new FormControl(false),
    expiration_date: new FormControl<NgbDateStruct|null>(null),
    created_by_project: new FormControl<number|null>(null),
    created_by_protocol: new FormControl<number|null>(null),
    created_by_session: new FormControl<number|null>(null),
    created_by_step: new FormControl<number|null>(null),
    lowStockThreshold: new FormControl<number|null>(null),
    lowStockNotification: new FormControl<boolean>(false),
  })



  searchProject = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      switchMap(value => {
        if (value.length < 2) {
          return of([])
        }
        return this.getProjects(value).pipe(
          map((response) => response.results.map((project) => {
            return project
          }))
        )
      })
    )
  }

  inputFormatter = (project: Project) => {
    return project.project_name
  }

  resultFormatter = (project: Project) => {
    return project.project_name
  }

  inputFormatterProtocol = (protocol: Protocol) => {
    return protocol.protocol_title
  }

  resultFormatterProtocol = (protocol: Protocol) => {
    return protocol.protocol_title
  }

  inputFormatterSession = (session: ProtocolSession) => {
    if (session.name) {
      return session.name
    } else {
      return session.unique_id
    }
  }

  resultFormatterSession = (session: ProtocolSession) => {
    if (session.name) {
      return session.name
    } else {
      return session.unique_id
    }
  }

  selectedProject(event: NgbTypeaheadSelectItemEvent) {
    this.createdByProject = event.item
    this.form.controls.created_by_project.setValue(event.item.id)
  }

  selectedProtocol(event: NgbTypeaheadSelectItemEvent) {
    this.createdByProtocol = event.item
    this.stepList = event.item.steps
    this.paginatedSteps = this.stepList.slice(0, this.pageSize)
    this.form.controls.created_by_protocol.setValue(event.item.id)
  }

  selectedSession(event: NgbTypeaheadSelectItemEvent) {
    this.createdBySession = event.item
    this.form.controls.created_by_session.setValue(event.item.id)
  }

  onSessionFocus(inputElement: HTMLInputElement) {
    const event = new Event('input', {bubbles: true});
    inputElement.dispatchEvent(event);
  }

  constructor(private zone: NgZone, private cdr: ChangeDetectorRef, private activeModal: NgbActiveModal, private fb: FormBuilder, private web: WebService) {
    this.form.controls.barcode.valueChanges.subscribe((data) => {
      if (data) {
        this.drawBarcode()
      }
    })
  }

  ngAfterViewInit() {
    if (this.form.controls.barcode.value) {
      this.detectBarcodeFormat();
    } else {
      this.drawBarcode();
    }
  }



  close() {
    this.activeModal.dismiss()
  }

  submit() {
    if (this.form.valid) {
      this.activeModal.close(this.form.value)
    }
  }

  drawBarcode() {
    if (this.storedReagent) {
      const canvas = document.getElementById(`stored-reagent-${this.storedReagent.id}-barcode-canvas`) as HTMLOrSVGImageElement
      if (this.form.controls.barcode.value) {
        try {
          JsBarcode(canvas, this.form.controls.barcode.value, {
            format: this.selectedBarcodeFormat,
            width: 2,
            height: 60,
            margin: 10,
            displayValue: true,
            fontSize: 12,
            flat: true,
            background: "#ffffff"
          });

          canvas.setAttribute('style', 'max-width:100%');
        } catch (e) {
          console.error('Barcode rendering error:', e);
          this.renderTextFallback(canvas, this.form.controls.barcode.value);
        }
      }
    }
  }
  onBarcodeFormatChange(event: any) {
    if (!event.target) {
      return
    }
    const format = event.target.value;
    this.selectedBarcodeFormat = format;
    this.drawBarcode();
  }

  renderTextFallback(canvas: HTMLOrSVGImageElement, text: string) {
    while (canvas.firstChild) {
      canvas.removeChild(canvas.firstChild);
    }

    const svgNS = "http://www.w3.org/2000/svg";
    const textElement = document.createElementNS(svgNS, "text");
    textElement.setAttribute("x", "50%");
    textElement.setAttribute("y", "50%");
    textElement.setAttribute("text-anchor", "middle");
    textElement.setAttribute("dominant-baseline", "middle");
    textElement.textContent = text;

    canvas.appendChild(textElement);
  }

  searchProtocol = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      switchMap(value => {
        if (value.length < 2) {
          return of([])
        }
        return this.getProtocols(value).pipe(
          map((response) => response.results.map((protocol) => {
            return protocol
          }))
        )
      })
    )
  }

  detectBarcodeFormat(): void {
    if (!this.storedReagent || !this.form.controls.barcode.value) return;

    const originalFormat = this.selectedBarcodeFormat;
    let validFormatFound = false;

    for (const format of this.barcodeFormats) {
      try {
        const testCanvas = document.createElement('canvas');
        testCanvas.style.display = 'none';
        document.body.appendChild(testCanvas);

        JsBarcode(testCanvas, this.form.controls.barcode.value, {
          format: format.value,
          displayValue: false,
          valid: (valid: boolean) => {
            if (valid && !validFormatFound) {
              console.log(`Found valid barcode format: ${format.value}`);
              this.selectedBarcodeFormat = format.value;
              validFormatFound = true;
              this.drawBarcode();
            }
          }
        });

        document.body.removeChild(testCanvas);

        if (validFormatFound) break;
      } catch (e) {
        console.debug(`Format ${format.value} failed:`, e);
      }
    }

    if (!validFormatFound) {
      console.warn('No valid barcode format found, using default');
      this.selectedBarcodeFormat = originalFormat;
    }
  }

  searchSession = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      switchMap(value => {
        if (!this.form.controls.created_by_protocol.value) {
          return of([])
        }
        return this.getSessions(this.createdByProtocol.id).pipe(
          map((response) => response.map((session) => {
            return session
          })),
          filter((sessions) => {
            return sessions.filter((session) => {
              if (session.name) {
                return session.name.toLowerCase().includes(value.toLowerCase())
              } else {
                return session.unique_id.toLowerCase().includes(value.toLowerCase())
              }
            }).length > 0
          })
        )
      }
    )
    )
  }



  ngOnInit() {

  }



  getProject(id: number)  {
    this.web.getProject(id).subscribe(
      (project) => {
        this.createdByProject = project
        this.formAutocomplete.controls.projectName.setValue(project.project_name)
      }
    )
  }

  getProjects(searchTerm: string) {
    return this.web.getProjects(undefined, 5, 0, searchTerm)
  }

  getProtocol(id: number) {
    this.web.getProtocol(id).subscribe(
      (protocol) => {
        this.zone.run(() => {
          this.createdByProtocol = protocol
          this.stepList = protocol.steps
          this.paginatedSteps = this.stepList.slice(0, this.pageSize)
          this.formAutocomplete.controls.protocolName.setValue(protocol.protocol_title)
          console.log(this.formAutocomplete.value)
        })

      }
    )
  }

  getProtocols(searchTerm: string) {
    return this.web.getUserProtocols(undefined, 5, 0, searchTerm)
  }

  getSession(id: string) {
    this.web.getProtocolSession(id).subscribe(
      (session) => {
        this.zone.run(() => {
          this.createdBySession = session
          this.form.controls.created_by_session.setValue(session.id)
          const name = session.name ? session.name : session.unique_id
          this.formAutocomplete.controls.sessionName.setValue(name)
          console.log(this.formAutocomplete.value)
        })
      }
    )
  }

  getSessions(protocolId: number) {
    return this.web.getAssociatedSessions(protocolId)
  }

  onPageChange(page: number): void {
    this.page = page;
    this.updatePaginatedSteps();
  }

  updatePaginatedSteps(): void {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedSteps = this.stepList.slice(start, end);
  }

  onStepHover(step: ProtocolStep): void {
    this.hoveredStep = step;
  }

  onStepUnhover(): void {
    this.hoveredStep = undefined;
  }

  selectStep(step: ProtocolStep): void {
    this.form.controls.created_by_step.setValue(step.id);
    if (this.storedReagent) {
      this.storedReagent.created_by_step = step;
    }
  }
}
