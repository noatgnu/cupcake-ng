import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {StoredReagent} from "../../storage-object";
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgbActiveModal, NgbTooltip, NgbTypeahead} from "@ng-bootstrap/ng-bootstrap";
import JsBarcode from "jsbarcode";
import {debounceTime, map, Observable, of, switchMap} from "rxjs";
import {SubcellularLocation} from "../../subcellular-location";
import {HumanDisease} from "../../human-disease";
import {Tissue} from "../../tissue";
import {Species} from "../../species";
import {MsVocab} from "../../ms-vocab";
import {WebService} from "../../web.service";
import {MetadataColumn} from "../../metadata-column";

@Component({
  selector: 'app-stored-reagent-editor-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgbTypeahead,
    NgbTooltip
  ],
  templateUrl: './stored-reagent-editor-modal.component.html',
  styleUrl: './stored-reagent-editor-modal.component.scss'
})
export class StoredReagentEditorModalComponent implements AfterViewInit, OnInit{
  metadataNameAutocomplete: string[] = ["Disease", "Tissue", "Subcellular location", "Organism", "Cell type"]
  private _storedReagent: StoredReagent|undefined = undefined

  @Input() set storedReagent(value: StoredReagent|undefined) {
    this._storedReagent = value
    if (value) {
      this.form.controls.quantity.setValue(value.quantity)
      this.form.controls.notes.setValue(value.notes)
      this.form.controls.barcode.setValue(value.barcode)
      this.form.controls.shareable.setValue(value.shareable)
    }
  }

  get storedReagent(): StoredReagent|undefined {
    return this._storedReagent
  }

  form = this.fb.group({
    quantity: new FormControl(0),
    notes: new FormControl(''),
    barcode: new FormControl(''),
    shareable: new FormControl(true)
  })

  formMetadata = this.fb.group({
    type: new FormControl('Characteristics'),
    name: new FormControl('', [Validators.required]),
    value: new FormControl('', [Validators.required])
  })

  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder, private web: WebService) {
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
}
