import {Component, Input} from '@angular/core';
import {FormBuilder, FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgbTooltip, NgbTypeahead, NgbTypeaheadSelectItemEvent} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../web.service";
import {debounceTime, map, Observable, of, switchMap} from "rxjs";
import {Unimod} from "../unimod";
import {MetadataColumn} from "../metadata-column";
import {StoredReagent} from "../storage-object";
import {Annotation} from "../annotation";
import {Instrument} from "../instrument";

@Component({
  selector: 'app-item-metadata',
  standalone: true,
    imports: [
        FormsModule,
        NgbTooltip,
        NgbTypeahead,
        ReactiveFormsModule
    ],
  templateUrl: './item-metadata.component.html',
  styleUrl: './item-metadata.component.scss'
})
export class ItemMetadataComponent {
  @Input() parentType: "stored_reagent"| "annotation" | "instrument" = "stored_reagent"

  private _storedReagent?: StoredReagent
  @Input() set storedReagent(value: StoredReagent) {
    this._storedReagent = value
    this.formMetadata.controls.type.setValue("Characteristics")
  }

  get storedReagent(): StoredReagent {
    return this._storedReagent!
  }

  private _annotation?: Annotation
  @Input() set annotation(value: Annotation) {
    this._annotation = value
    this.formMetadata.controls.type.setValue("Characteristics")
  }

  get annotation(): Annotation {
    return this._annotation!
  }

  private _instrument?: Instrument

  @Input() set instrument(value: Instrument) {
    this._instrument = value
    this.formMetadata.controls.type.setValue("Comment")
    this.formMetadata.controls.name.setValue("Instrument")
  }

  get instrument(): Instrument {
    return this._instrument!
  }

  metadataTypeAutocomplete: string[] = ["Characteristics", "Comment", "Factor value", "Other"]
  metadataNameAutocomplete: string[] = ["Disease", "Tissue", "Subcellular location", "Organism", "Instrument", "Label", "Cleavage agent details", "Dissociation method", "Modification parameters", "Cell type", "Enrichment process"]
  metadataOtherAutocomplete: string[] = ["Source name", "Material type", "Assay name", "Technology type"]
  metadataCharacteristics: string[] = ["Disease", "Tissue", "Subcellular location", "Organism", "Cell type", "Cell line", "Developmental stage", "Ancestry category", "Sex", "Age", "Biological replicate", "Enrichment process"]
  metadataComment: string[] = ["Data file", "File uri", "Technical replicate", "Fraction identifier", "Label", "Cleavage agent details", "Instrument", "Modification parameters", "Dissociation method", "Precursor mass tolerance", "Fragment mass tolerance", ""]


  formMetadata = this.fb.group({
    type: "Characteristics",
    name: "",
    value: "",
    metadataMT: "Fixed",
    metadataPP: "Anywhere",
    metadataTA: "",
    metadataTS: "",
    metadataMM: 0,
  })


  optionsArray: Unimod[] = []
  selectedUnimod: Unimod|undefined = undefined
  availableSpecs: any[] = []


  constructor(private fb: FormBuilder, private web: WebService) {
  }

  selectAutoComplete(event: NgbTypeaheadSelectItemEvent) {
    if (this.formMetadata.value.name?.toLowerCase() === "modification parameters") {
      this.selectedUnimod = this.optionsArray.find((option) => option.name === event.item)
      if (this.selectedUnimod) {
        const mapData: any = {}
        for (const a of this.selectedUnimod.additional_data) {
          if (a["id"] === "delta_mono_mass") {
            this.formMetadata.controls.metadataMM.setValue(parseFloat(a["description"]))
          }
          if (a["id"].startsWith("spec_")) {
            const nameSplitted = a["id"].split("_")
            const name = `spec_${nameSplitted[1]}`
            if (!mapData[name]) {
              mapData[name] = {name: name}
            }
            if (a["id"].endsWith("position")) {
              mapData[name]["position"] = a["description"]
            } else if (a["id"].endsWith("site")) {
              mapData[name]["aa"] = a["description"]
            } else if (a["id"].endsWith("classification")) {
              mapData[name]["classification"] = a["description"]
            } else if (a["id"].endsWith("mono_mass")) {
              const mm = parseFloat(a["description"])
              if (mm > 0) {
                mapData[name]["mono_mass"] = mm
              }
            }
          }
        }
        this.availableSpecs = Object.values(mapData)
      }
    }
  }

  selectSpec(spec: any) {
    if (spec.position) {
      this.formMetadata.controls.metadataPP.setValue(spec.position)
    }
    if (spec.aa) {
      this.formMetadata.controls.metadataTA.setValue(spec.aa)
    }
    if (spec.mono_mass) {
      this.formMetadata.controls.metadataMM.setValue(spec.mono_mass)
    }
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
        } else if (name === "modification parameters") {
          return this.web.getUnimod(undefined, 5, 0, value).pipe(
            map((response) => {
              this.optionsArray = response.results
              return response.results.map((unimod: Unimod) => {
                return unimod.name
              })
            })
          )
        } else {
          return of([])
        }
      })
    )
  }

  removeMetadata(m: MetadataColumn) {
    switch (this.parentType) {
      case "stored_reagent":
        this.web.deleteMetaDataColumn(m.id).subscribe((response) => {
          if (this.storedReagent) {
            this.storedReagent.metadata_columns = this.storedReagent.metadata_columns.filter((column) => column.id !== m.id)
          }
        })
        break
      case "annotation":
        this.web.deleteMetaDataColumn(m.id).subscribe((response) => {
          if (this.annotation) {
            this.annotation.metadata_columns = this.annotation.metadata_columns.filter((column) => column.id !== m.id)
          }
        })
        break
      case "instrument":
        this.web.deleteMetaDataColumn(m.id).subscribe((response) => {
          if (this.instrument) {
            this.instrument.metadata_columns = this.instrument.metadata_columns.filter((column) => column.id !== m.id)
          }
        })
        break
    }
  }

  searchName = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      switchMap(value => {
        if (value.length < 2) {
          return of(this.metadataNameAutocomplete.slice(0, 5))
        }
        if (this.formMetadata.controls.type.value === "Characteristics") {
          return of(this.metadataCharacteristics.filter(v => v.toLowerCase().indexOf(value.toLowerCase()) > -1).slice(0, 5))
        } else if (this.formMetadata.controls.type.value === "Comment") {
          return of(this.metadataComment.filter(v => v.toLowerCase().indexOf(value.toLowerCase()) > -1).slice(0, 5))
        } else {
          return of(this.metadataOtherAutocomplete.filter(v => v.toLowerCase().indexOf(value.toLowerCase()) > -1).slice(0, 5))
        }
      })
    )
  }

  addMetadataColumn() {

    if (this.formMetadata.valid) {
      switch (this.parentType) {
        case "stored_reagent":
          this.web.createMetaDataColumn(this.storedReagent.id, this.formMetadata.value, this.parentType).subscribe((response) => {
            this.storedReagent?.metadata_columns.push(response)
            this.formMetadata.reset()
          })
          break
        case "annotation":
          this.web.createMetaDataColumn(this.annotation.id, this.formMetadata.value, this.parentType).subscribe((response) => {
            this.annotation?.metadata_columns.push(response)
            this.formMetadata.reset()
          })
          break
        case "instrument":
          this.web.createMetaDataColumn(this.instrument.id, this.formMetadata.value, this.parentType).subscribe((response) => {
            this.instrument?.metadata_columns.push(response)
            this.formMetadata.reset()
          })
          break

      }

    }
  }
}
