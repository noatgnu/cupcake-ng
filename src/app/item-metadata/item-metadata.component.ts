import {Component, Input} from '@angular/core';
import {FormBuilder, FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgbTooltip, NgbTypeahead, NgbTypeaheadSelectItemEvent} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../web.service";
import {catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap} from "rxjs";
import {Unimod} from "../unimod";
import {MetadataColumn} from "../metadata-column";
import {StoredReagent} from "../storage-object";
import {Annotation} from "../annotation";
import {Instrument} from "../instrument";
import { MetadataService } from '../metadata.service';

@Component({
    selector: 'app-item-metadata',
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



  formMetadata = this.fb.group({
    type: "Characteristics",
    name: "",
    value: "",
    metadataMT: "Fixed",
    metadataPP: "Anywhere",
    metadataTA: "",
    metadataTS: "",
    metadataMM: 0,
    metadataAC: "",
    metadataSP: "",
    metadataCT: "",
    metadataQY: "",
    metadataPS: "",
    metadataCN: "",
    metadataCV: "",
    metadataCS: "",
    metadataCF: "",
    y1: "0",
    y2: "0",
    m1: "0",
    m2: "0",
    d1: "0",
    d2: "0",
    ageRange: false,
    samples: "",
    characteristics: false
  })


  //optionsArray: Unimod[] = []
  //selectedUnimod: Unimod|undefined = undefined
  //availableSpecs: any[] = []


  constructor(private fb: FormBuilder, private web: WebService, public metadataService: MetadataService) {
    this.formMetadata.controls.name.valueChanges.subscribe((value) => {
      if (value) {
        if (value === "Proteomics data acquisition method") {
          this.web.getMSVocab(undefined, 100, 0, undefined, value.toLowerCase()).subscribe(
            (response) => {
              this.metadataService.dataAcquisitionMethods = response.results.map((r) => r.name)
            }
          )
        } else if (value === "Alkylation reagent") {
          this.web.getMSVocab(undefined, 100, 0, undefined, value.toLowerCase()).subscribe(
            (response) => {
              this.metadataService.alkylationReagents = response.results.map((r) => r.name)
            }
          )
        } else if (value === "Reduction reagent") {
          this.web.getMSVocab(undefined, 100, 0, undefined, value.toLowerCase()).subscribe(
            (response) => {
              this.metadataService.reductionReagents = response.results.map((r) => r.name)
            }
          )
        } else if (value === "Enrichment process") {
          this.web.getMSVocab(undefined, 100, 0, undefined, value.toLowerCase()).subscribe(
            (response) => {
              this.metadataService.enrichmentProcesses = response.results.map((r) => r.name)
            }
          )
        } else if (value === "Label") {
          this.web.getMSVocab(undefined, 100, 0, undefined, 'sample attribute').subscribe(
            (response) => {
              this.metadataService.labelTypes = response.results.map((r) => r.name)
            }
          )
        } else if (value === "MS2 analyzer type") {
          this.web.getMSVocab(undefined, 100, 0, undefined, 'mass analyzer type').subscribe(
            (response) => {
              this.metadataService.ms2AnalyzerTypes = response.results.map((r) => r.name)
            }
          )
        }
      }
    })
  }

  selectAutoComplete(event: NgbTypeaheadSelectItemEvent) {
    const item = event.item
    if (this.formMetadata.value.name === "Modification parameters") {
      const formUpdate = this.metadataService.getSelectedData(item, this.formMetadata.value.name)
      this.formMetadata.patchValue(formUpdate)
    }

    /*if (this.formMetadata.value.name?.toLowerCase() === "modification parameters") {
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
    }*/
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

  searchMetadata = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(value => {
        if (value.length < 2) {
          return of([]);
        }
        if (!this.formMetadata.value.name) {
          return of([]);
        }
        let name = this.formMetadata.value.name.toLowerCase();
        if (name === "spiked compound") {
          name = "organism"
        } else if (name === "ms2 analyzer type") {
          name = "mass analyzer type"
        }
        return this.metadataService.metadataTypeAheadDataGetter(name, value).pipe(
          map(results => {
            return results;
          }), catchError(() => {
            return of([]);
          })
        )
      })
    );
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
          return of(this.metadataService.metadataNameAutocomplete.slice(0, 5))
        }
        if (this.formMetadata.controls.type.value === "Characteristics") {
          return of(this.metadataService.metadataCharacteristics.filter(v => v.toLowerCase().indexOf(value.toLowerCase()) > -1).slice(0, 5))
        } else if (this.formMetadata.controls.type.value === "Comment") {
          return of(this.metadataService.metadataComment.filter(v => v.toLowerCase().indexOf(value.toLowerCase()) > -1).slice(0, 5))
        } else {
          return of(this.metadataService.metadataOtherAutocomplete.filter(v => v.toLowerCase().indexOf(value.toLowerCase()) > -1).slice(0, 5))
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
