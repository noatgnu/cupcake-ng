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
  NgbInputDatepicker,
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
import {Protocol} from "../../protocol";
import {ProtocolSession} from "../../protocol-session";

@Component({
  selector: 'app-stored-reagent-editor-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgbTypeahead,
    NgbTooltip,
    NgbInputDatepicker,
    FormsModule,
    NgbHighlight
  ],
  templateUrl: './stored-reagent-editor-modal.component.html',
  styleUrl: './stored-reagent-editor-modal.component.scss'
})
export class StoredReagentEditorModalComponent implements AfterViewInit, OnInit{
  metadataNameAutocomplete: string[] = ["Disease", "Tissue", "Subcellular location", "Organism", "Cell type"]
  private _storedReagent: StoredReagent|undefined = undefined
  createdByProject!: Project
  createdBySession!: ProtocolSession
  createdByProtocol!: Protocol

  @Input() set storedReagent(value: StoredReagent|undefined) {
    this._storedReagent = value
    if (value) {
      this.form.controls.quantity.setValue(value.quantity)
      this.form.controls.notes.setValue(value.notes)
      this.form.controls.barcode.setValue(value.barcode)
      this.form.controls.shareable.setValue(value.shareable)
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
    expiration_date: new FormControl<NgbDateStruct|null>(null),
    created_by_project: new FormControl<number|null>(null),
    created_by_protocol: new FormControl<number|null>(null),
    created_by_session: new FormControl<number|null>(null)
  })

  formMetadata = this.fb.group({
    type: new FormControl('Characteristics'),
    name: new FormControl('', [Validators.required]),
    value: new FormControl('', [Validators.required])
  })

  formAutocomplete = this.fb.group({
    projectName: new FormControl(''),
    protocolName: new FormControl(''),
    sessionName: new FormControl('')
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
    this.drawBarcode()
  }

  addMetadataColumn() {
    if (!this.storedReagent) {
      return
    }
    if (this.formMetadata.valid) {

      this.web.createMetaDataColumn(this.storedReagent.id, this.formMetadata.value).subscribe((response) => {
        this.storedReagent?.metadata_columns.push(response)
        this.formMetadata.reset()
      })
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
        JsBarcode(canvas, this.form.controls.barcode.value, {
          format: 'EAN13',
          width: 5,  // Increase this value to make the barcode thicker
          height: 100,  // Decrease this value to make the barcode shorter
          margin: 50,
          displayValue: true
        })
      }
    }

  }

  searchName = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      switchMap(value => {
        if (value.length < 2) {
          return of(this.metadataNameAutocomplete.slice(0, 5))
        }
        return of(this.metadataNameAutocomplete.filter(v => v.toLowerCase().indexOf(value.toLowerCase()) > -1).slice(0, 5))
      })
    )
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

  searchValue = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      switchMap(value => {
        if (value.length < 2) {
          return of([])
        }
        if (!this.formMetadata.controls.name.value) {
          return of([])
        }
        const name = this.formMetadata.controls.name.value.toLowerCase()
        if (name === "subcellular location") {
          return this.web.getSubcellularLocations(undefined, 5, 0, value).pipe(
            map((response) => response.results.map((location) => {
              return location.location_identifier
            }))
          )
        } else if (name === "disease") {
          return this.web.getHumandDiseases(undefined, 5, 0, value).pipe(
            map((response) => response.results.map((disease) => {
              return disease.identifier
            })
          ))
        } else if (name === "tissue") {
          return this.web.getTissues(undefined, 5, 0, value).pipe(
            map((response) => response.results.map((tissue) => {
              return tissue.identifier
            }))
          )
        } else if (name === "organism") {
          return this.web.getSpecies(undefined, 5, 0, value).pipe(
            map((response) => response.results.map((species) => {
              return species.official_name
            }))
          )
        } else if (["cleavage agent details", "instrument", "dissociation method", "enrichment process"].includes(name)) {
          return this.web.getMSVocab(undefined, 5, 0, value, name).pipe(
            map((response) => response.results.map((vocab) => {
              return vocab.name
            }))
          )
        } else if (name === "label") {
          return this.web.getMSVocab(undefined, 5, 0, value, "sample attribute").pipe(
            map((response) => response.results.map((vocab) => {
              return vocab.name
            }))
          )
        } else if (name === "cell type") {
          return this.web.getMSVocab(undefined, 5, 0, value, "cell line").pipe(
            map((response) => response.results.map((vocab) => {
              return vocab.name
            }))
          )
        } else {
          return of([])
        }
      })
    )
  }

  ngOnInit() {

  }

  removeMetadata(m: MetadataColumn) {
    if (this.storedReagent) {
      this.web.deleteMetaDataColumn(m.id).subscribe((response) => {
        if (this.storedReagent) {
          this.storedReagent.metadata_columns = this.storedReagent.metadata_columns.filter((column) => column.id !== m.id)
        }

      })
    }
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
}
