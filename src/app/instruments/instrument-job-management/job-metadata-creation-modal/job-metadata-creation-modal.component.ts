import {Component, Input} from '@angular/core';
import {catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap, tap} from "rxjs";
import {NgbActiveModal, NgbModal, NgbTypeahead, NgbTypeaheadSelectItemEvent} from "@ng-bootstrap/ng-bootstrap";
import {MetadataService} from "../../../metadata.service";
import {FormBuilder, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MetadataColumn} from "../../../metadata-column";
import {WebService} from "../../../web.service";

@Component({
    selector: 'app-job-metadata-creation-modal',
    imports: [
        ReactiveFormsModule,
        NgbTypeahead,
        FormsModule
    ],
    templateUrl: './job-metadata-creation-modal.component.html',
    styleUrl: './job-metadata-creation-modal.component.scss',
    providers: [MetadataService]
})
export class JobMetadataCreationModalComponent {
  private _name: string = ""
  @Input() set name(value: string) {
    this.form.controls.metadataName.setValue(value)
    this._name = value
  }

  get name(): string {
    return this._name
  }
  private _type: string = ""
  @Input() set type(value: string) {
    this.form.controls.metadataType.setValue(value)
    this._type = value
  }

  @Input() set samples(value: string) {
    this.form.controls.samples.setValue(value)
  }

  get type(): string {
    return this._type
  }

  @Input() allowMultipleSpecSelection: boolean = true
  @Input() modifier: boolean = false

  form = this.fb.group({
    metadataName: "Tissue",
    metadataType: "",
    metadataValue: "",
    metadataMT: "Fixed",
    metadataPP: "Anywhere",
    metadataTA: "",
    metadataTS: "",
    metadataMM: 0,
    metadataAC: "",
    samples: "",
    characteristics: false
  })

  private _value: string = ""
  @Input() set value(value: string) {
    const valueSplitted = value.split(";")
    valueSplitted.forEach((v) => {
      const subSplitted = v.split("=")
      if (subSplitted.length === 2) {
        switch (subSplitted[0].trim().toLowerCase()) {
          case "mt":
            this.form.controls.metadataMT.setValue(subSplitted[1].trim())
            break
          case "pp":
            this.form.controls.metadataPP.setValue(subSplitted[1].trim())
            break
          case "ta":
            this.form.controls.metadataTA.setValue(subSplitted[1].trim())
            break
          case "ts":
            this.form.controls.metadataTS.setValue(subSplitted[1].trim())
            break
          case "mm":
            this.form.controls.metadataMM.setValue(parseFloat(subSplitted[1].trim()))
            break
          case "ac":
            this.form.controls.metadataAC.setValue(subSplitted[1].trim())
            break
          case "nt":
            this.form.controls.metadataValue.setValue(subSplitted[1].trim())
            if (this.form.controls.metadataName.value === "Modification parameters") {
              this.web.getUnimod(undefined, 5, 0, subSplitted[1].trim()).pipe(
                map((response) => {
                  this.metadataService.optionsArray = response.results
                  return response.results
                })
              ).subscribe()
            }
            break
        }
      } else {
        this.form.controls.metadataValue.setValue(subSplitted[0].trim())
        if (this.form.controls.metadataName.value === "Modification parameters") {
          this.web.getUnimod(undefined, 5, 0, subSplitted[0].trim()).pipe(
            map((response) => {
              this.metadataService.optionsArray = response.results
              return response.results
            })
          ).subscribe()
        }
      }
    })
  }

  get value(): string {
    return this._value
  }

  selectedSpecs: any[] = []

  constructor(private web: WebService, private modal: NgbActiveModal, public metadataService: MetadataService, private fb: FormBuilder) {

  }

  formatter = (data: any) => {
    if (data) {
      if (typeof data === "string") {
        return data
      }
      if ("identifier" in data) {
        return data.identifier
      } else if ("official_name" in data){
        return data.official_name
      } else if ("location_identifier" in data) {
        return data.location_identifier
      } else if ("name" in data) {
        return data.name
      }
    }
    return ""
  }

  searchMetadata = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(value => {
        if (value.length < 2) {
          return of([]);
        }
        if (!this.name) {
          return of([]);
        }
        const name = this.name.toLowerCase();
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

  onItemSelect(event: NgbTypeaheadSelectItemEvent) {
    const item = event.item
    if (this.form.value.metadataName === "Modification parameters") {
      const formUpdate = this.metadataService.getSelectedData(item, this.form.value.metadataName)
      this.form.patchValue(formUpdate)
    }
  }

  close() {
    this.modal.dismiss()
  }

  save() {
    if (this.name === "Modification parameters") {
      const result: any[] = []
      let specs = this.selectedSpecs
      // check if this.selectedSpecs is array
      if (!Array.isArray(this.selectedSpecs)) {
        specs = [this.selectedSpecs]
      }
      console.log(specs)
      for (const s of specs) {
        const formResult = this.form.value
        const copied = JSON.parse(JSON.stringify(formResult))
        if (s.position) {
          copied['metadataPP'] = s.position
        }
        if (s.aa) {
          copied['metadataTA'] = s.aa
        }
        if (s.mono_mass) {
          copied['metadataMM'] = s.mono_mass
        }
        if (s.target_site) {
          copied['metadataTS'] = s.target_site
        }
        result.push(copied)
      }
      console.log(result)
      this.modal.close(result)
    } else {
      this.modal.close([this.form.value])
    }
  }

}
