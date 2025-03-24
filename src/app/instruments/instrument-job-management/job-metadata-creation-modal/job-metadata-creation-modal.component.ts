import {Component, Input} from '@angular/core';
import {catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap, tap} from "rxjs";
import {
  NgbActiveModal,
  NgbNav, NgbNavContent, NgbNavItem, NgbNavLink, NgbNavLinkButton,
  NgbNavOutlet, NgbPagination,
  NgbTypeahead,
  NgbTypeaheadSelectItemEvent
} from "@ng-bootstrap/ng-bootstrap";
import {MetadataService} from "../../../metadata.service";
import {FormBuilder, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {WebService} from "../../../web.service";
import {FavouriteMetadataOptionQuery} from "../../../favourite-metadata-option";
import {LabGroup} from "../../../lab-group";
import {MetadataColumn} from "../../../metadata-column";
import {AccountsService} from "../../../accounts/accounts.service";

@Component({
    selector: 'app-job-metadata-creation-modal',
  imports: [
    ReactiveFormsModule,
    NgbTypeahead,
    FormsModule,
    NgbNavLink,
    NgbNavItem,
    NgbNav,
    NgbNavOutlet,
    NgbNavContent,
    NgbPagination,
    NgbNavLinkButton
  ],
    templateUrl: './job-metadata-creation-modal.component.html',
    styleUrl: './job-metadata-creation-modal.component.scss',
    providers: [MetadataService]
})
export class JobMetadataCreationModalComponent {
  service_lab_group_recommenations: FavouriteMetadataOptionQuery|undefined
  user_favourite_metadata: FavouriteMetadataOptionQuery|undefined
  global_recommendations: FavouriteMetadataOptionQuery|undefined
  currentServiceLabRecommendationsPage = 1
  currentUserFavouriteMetadataPage = 1
  currentGlobalRecommendationsPage = 1
  pageSize = 10
  activeID: string = "user"
  @Input() previewMode: boolean = false
  @Input() service_lab_group_id: number = -1
  @Input() possibleColumns: MetadataColumn[] = []
  private _name: string = ""
  @Input() set name(value: string) {
    this.form.controls.metadataName.setValue(value)
    this._name = value
    console.log(this.service_lab_group_id)
    if (value && this.service_lab_group_id > 0) {
      this.getGlobalRecommendations()
      if (this.account.loggedIn) {
        this.getUserFavouriteMetadataOptions()
      }
      this.getServiceLabRecommendations()
    }
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
    search_type: ["startswith"],
    metadataName: "Tissue",
    metadataType: "",
    metadataValue: "",
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
    characteristics: false,
    auto_generated: false,
    hidden: false,
    readonly: false,
  })

  private _value: string = ""
  @Input() set value(value: string) {

    if (this.name === "Age") {
      const splitted = value.split("-")
      for (let i = 0; i < splitted.length; i++) {
        //use regex to parse YMD where Y M D are optional
        const years = value.match(/([0-9]+)Y/)
        const months = value.match(/([0-9]+)M/)
        const days = value.match(/([0-9]+)D/)
        if (years) {
          //set value of year
          //@ts-ignore
          this.form.controls[`y${i + 1}`].setValue(years[1])
        }
        if (months) {
          //set value of month
          //@ts-ignore
          this.form.controls[`m${i + 1}`].setValue(months[1])
        }
        if (days) {
          //set value of day
          //@ts-ignore
          this.form.controls[`d${i + 1}`].setValue(days[1])
        }
      }

    } else {
      const valueSplitted = value.split(";")
      valueSplitted.forEach((v) => {
        const subSplitted = v.split("=")
        if (subSplitted.length === 2) {

          switch (subSplitted[0].trim().toLowerCase()) {
            case "sp":
              this.form.controls.metadataSP.setValue(subSplitted[1].trim())
              break
            case "cy":
              this.form.controls.metadataCT.setValue(subSplitted[1].trim())
              break
            case "qy":
              this.form.controls.metadataQY.setValue(subSplitted[1].trim())
              break
            case "ps":
              this.form.controls.metadataPS.setValue(subSplitted[1].trim())
              break
            case "cn":
              this.form.controls.metadataCN.setValue(subSplitted[1].trim())
              break
            case "cv":
              this.form.controls.metadataCV.setValue(subSplitted[1].trim())
              break
            case "cs":
              this.form.controls.metadataCS.setValue(subSplitted[1].trim())
              break
            case "cf":
              this.form.controls.metadataCF.setValue(subSplitted[1].trim())
              break
            case "mt":
              this.form.controls.metadataMT.setValue(subSplitted[1].trim())
              break
            case "pp":
              this.form.controls.metadataPP.setValue(subSplitted[1].trim())
              break
            case "ta":
              this.form.controls.metadataTA.setValue(subSplitted[1].trim())
              for (const s of this.metadataService.availableSpecs) {
                if (s.aa === subSplitted[1].trim()) {
                  if (!Array.isArray(this.selectedSpecs)) {
                    this.selectedSpecs = s
                  } else {
                    if (!this.selectedSpecs.includes(s)) {
                      this.selectedSpecs.push(s)
                    }
                  }
                  console.log(this.selectedSpecs)
                  break
                }
              }
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
                ).subscribe(
                  (response) => {
                    for (const i of response) {
                      if (i.name === subSplitted[1].trim()) {
                        // @ts-ignore
                        this.metadataService.getSelectedData(i.name, this.form.value.metadataName)
                        for (const s of this.metadataService.availableSpecs) {
                          if (s.aa === subSplitted[1].trim()) {
                            if (!Array.isArray(this.selectedSpecs)) {
                              this.selectedSpecs = s
                            } else {
                              if (!this.selectedSpecs.includes(s)) {
                                this.selectedSpecs.push(s)
                              }
                            }
                            console.log(this.selectedSpecs)
                            break
                          }
                        }
                        console.log(this.selectedSpecs)
                      }
                    }
                  }
                )
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
            ).subscribe(
              (response) => {
                for (const i of response) {
                  if (i.name === subSplitted[0].trim()) {
                    // @ts-ignore
                    this.metadataService.getSelectedData(i.name, this.form.value.metadataName)
                    for (const s of this.metadataService.availableSpecs) {
                      if (s.aa === this.form.controls.metadataTA.value) {
                        if (!Array.isArray(this.selectedSpecs)) {
                          this.selectedSpecs = s
                        } else {
                          if (!this.selectedSpecs.includes(s)) {
                            this.selectedSpecs.push(s)
                          }
                        }
                        console.log(this.selectedSpecs)
                        break
                      }
                    }
                  }
                }
              }
            )
          }
        }
      })
    }

  }

  get value(): string {
    return this._value
  }

  selectedSpecs: any[] = []

  constructor(private account: AccountsService, private web: WebService, private modal: NgbActiveModal, public metadataService: MetadataService, private fb: FormBuilder) {

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
        let name = this.name.toLowerCase();
        if (name === "spiked compound") {
          name = "organism"
        } else if (name === "ms2 analyzer type") {
          name = "mass analyzer type"
        }
        // @ts-ignore
        return this.metadataService.metadataTypeAheadDataGetter(name, value, this.form.value.search_type).pipe(
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
      this.modal.close(result)
    } else {
      this.modal.close([this.form.value])
    }
  }

  getUserFavouriteMetadataOptions() {
    if (this.service_lab_group_id > 0) {
      this.web.getFavouriteMetadataOptions(this.pageSize, (this.currentUserFavouriteMetadataPage-1)*this.pageSize, undefined, 'user', undefined, this.name).subscribe(
        (response) => {
          this.user_favourite_metadata = response
        }
      )
    }

  }

  getServiceLabRecommendations() {
    this.web.getFavouriteMetadataOptions(this.pageSize, (this.currentServiceLabRecommendationsPage-1)*this.pageSize, undefined, "service_lab_group", this.service_lab_group_id, this.name).subscribe(
      (response) => {
        this.service_lab_group_recommenations = response
      }
    )
  }

  getGlobalRecommendations() {
    this.web.getFavouriteMetadataOptions(this.pageSize, (this.currentGlobalRecommendationsPage-1)*this.pageSize, undefined, undefined, undefined, this.name, undefined, true).subscribe(
      (response) => {
        this.global_recommendations = response
      }
    )
  }

  onPageChange(page: number, type: string) {
    if (type === "user") {
      this.currentUserFavouriteMetadataPage = page
      this.getUserFavouriteMetadataOptions()
    } else if (type === "group") {
      this.currentServiceLabRecommendationsPage = page
      this.getServiceLabRecommendations()
    } else {
      this.currentGlobalRecommendationsPage = page
      this.getGlobalRecommendations()
    }
  }
}
