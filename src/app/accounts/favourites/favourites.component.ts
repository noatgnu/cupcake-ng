import { Component } from '@angular/core';
import {WebService} from "../../web.service";
import {FormArray, FormBuilder, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {FavouriteMetadataOption, FavouriteMetadataOptionQuery} from "../../favourite-metadata-option";
import {
  NgbCollapse,
  NgbDropdown,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbModal,
  NgbPagination,
  NgbTooltip
} from "@ng-bootstrap/ng-bootstrap";
import {debounceTime, distinctUntilChanged, forkJoin, map, Observable, of, switchMap, tap} from "rxjs";
import {User} from "../../user";
import {LabGroup, LabGroupQuery} from "../../lab-group";
import {AccountsService} from "../accounts.service";
import {ExploreMetadataComponent} from "./explore-metadata/explore-metadata.component";
import {
  JobMetadataCreationModalComponent
} from "../../instruments/instrument-job-management/job-metadata-creation-modal/job-metadata-creation-modal.component";
import {MetadataService} from "../../metadata.service";
import {NgClass} from "@angular/common";
import {ToastService} from "../../toast.service";

@Component({
  selector: 'app-favourites',
  imports: [
    NgbPagination,
    NgbTooltip,
    FormsModule,
    ExploreMetadataComponent,
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle,
    ReactiveFormsModule,
    NgbCollapse,
    NgClass
  ],
  templateUrl: './favourites.component.html',
  styleUrl: './favourites.component.scss'
})
export class FavouritesComponent {
  creatorIsCollapsed = true;

  page = 1
  pageSize = 10;

  editableCell: {row: number, col: string} | undefined = undefined;
  currentCell: {row: number, col: string} | undefined = undefined;

  favouriteQuery: FavouriteMetadataOptionQuery| undefined = undefined;

  justCreatedFavourite: FavouriteMetadataOption|undefined = undefined;

  form = this.fb.group({
    searchTerm: [""],
    searchName: [""],
    filterBy: [""],
  })

  userMap: { [key: number]: User } = {}
  labGroupMap: { [key: number]: LabGroup } = {}

  formFavourite = this.fb.group({
    name: [''],
    type: [''],
    mode: ['user'],
    value: [''],
    displayName: ['']
  })

  formLabGroup = this.fb.group({
    service_lab_group: [''],
    search_term: ['']
  })

  searchingLabGroup = false
  labGroupPage = 1
  labGroupPageSize = 10
  labGroupQuery: LabGroupQuery|undefined = undefined
  constructor(private toast: ToastService, public metadata: MetadataService, private modal: NgbModal, public accountService: AccountsService, private web: WebService, private fb: FormBuilder) {
    this.getFavourites()
    this.formFavourite.controls.name.valueChanges.subscribe((value) => {
      if (value) {
        if (this.metadata.staffMetadataSpecific.includes(value)) {
          this.formFavourite.controls.type.setValue("Comment")
        } else {
          for (const m of this.metadata.userMetadataTemplate) {
            if (m.name === value) {
              this.formFavourite.controls.type.setValue(m.type)
              return
            }
          }
        }
      }
    })
    this.formLabGroup.controls.search_term.valueChanges.subscribe((value) => {
      if (value) {
        this.web.getUserLabGroups(value, this.labGroupPageSize, 0, true).subscribe((data: LabGroupQuery) => {
          this.labGroupQuery = data
        })
      }
    })
    this.form.controls.searchTerm.valueChanges.subscribe((value) => {

    })
    this.getLabGroups("")
  }

  searchFavourite() {
    this.page = 1
    this.getFavourites(this.form.value.searchTerm)
  }

  getLabGroups(value: string) {
    const offset = (this.labGroupPage - 1) * this.labGroupPageSize
    this.web.getLabGroups(value, this.labGroupPageSize, offset, true).subscribe((data: LabGroupQuery) => {
      this.labGroupQuery = data
    })
  }

  labGroupPageChange(page: number) {
    this.labGroupPage = page
    // @ts-ignore
    this.getLabGroups(this.formLabGroup.controls.search_term.value)
  }

  searchLabGroup = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      tap(() => this.searchingLabGroup = true),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) {
          return of([])
        }
        return this.web.getLabGroups(term, this.labGroupPageSize, 0, true).pipe(map((labGroups: LabGroupQuery) => labGroups.results))
      }),
      tap(() => this.searchingLabGroup = false)
    )
  }

  getFavourites(searchTerm: string|null|undefined = null) {
    const offset = (this.page - 1) * this.pageSize
    // @ts-ignore
    this.web.getFavouriteMetadataOptions(this.pageSize, offset, searchTerm, this.form.value.filterBy, this.formLabGroup.value.service_lab_group, this.form.value.searchName).subscribe((data: FavouriteMetadataOptionQuery) => {
      this.favouriteQuery = data;
      const userIDs: number[] = []
      const labGroupIDs: number[] = []
      for (const f of data.results) {
        if (f.user) {
          if (!userIDs.includes(f.user)) {
            userIDs.push(f.user)
          }
        }
        if (f.service_lab_group) {
          if (!labGroupIDs.includes(f.service_lab_group)) {
            labGroupIDs.push(f.service_lab_group)
          }
        }
      }
      if (userIDs.length > 0) {
        forkJoin(userIDs.map((ui) => this.web.getUser(ui))).subscribe(
          (users: User[]) => {
            for (const user of users) {
              this.userMap[user.id] = user
            }
          }
        )
      }
      if (labGroupIDs.length > 0) {
        forkJoin(labGroupIDs.map((li) => this.web.getLabGroup(li))).subscribe(
          (labGroups: LabGroup[]) => {
            for (const labGroup of labGroups) {
              this.labGroupMap[labGroup.id] = labGroup
            }
          }
        )
      }
    })
  }

  onPageChange(page: number) {
    this.page = page
    this.getFavourites(this.form.value.searchTerm)
  }

  removeFavourite(id: number) {
    this.web.deleteFavouriteMetadataOption(id).subscribe(() => {
      this.getFavourites(this.form.value.searchTerm)
    })
  }

  toggleFavouriteGlobal(favourite: FavouriteMetadataOption) {
    this.web.updateFavouriteMetadataOption(favourite.id, {is_global:!favourite.is_global}).subscribe((data) => {
      const index = this.favouriteQuery!.results.findIndex((f) => f.id === favourite.id)
      this.favouriteQuery!.results[index] = data
    }, (error) => {
      if (error.status === 409) {
        this.toast.show("Favourite Metadata", "There is already a global favourite with this display name")
      }
    })
  }

  toggleEditableCell(rowNumber: number, col: string) {
    this.editableCell = {row: rowNumber, col: col}
  }

  saveEditableCell(favourite: FavouriteMetadataOption, field: string) {
    const payload: any = {}
    // @ts-ignore
    payload[field] = favourite[field]
    this.web.updateFavouriteMetadataOption(favourite.id, payload).subscribe((data) => {
      const index = this.favouriteQuery!.results.findIndex((f) => f.id === favourite.id)
      this.favouriteQuery!.results[index] = data
      this.editableCell = undefined
    })
  }

  editFavoriteMetadata(favourite: FavouriteMetadataOption) {
    const ref = this.modal.open(JobMetadataCreationModalComponent, {scrollable: true})
    ref.componentInstance.name = favourite.name
    ref.componentInstance.type = favourite.type
    ref.componentInstance.value = favourite.value
    if (favourite.name === "Modification parameters") {
      ref.componentInstance.allowMultipleSpecSelection = false
    }

    ref.result.then((result: any[]) => {
      if (result) {
        for (const r of result) {
          let value = r.metadataValue
          value = this.metadata.tranformMetadataValue(r, value);
          this.web.updateFavouriteMetadataOption(favourite.id, {value: value}).subscribe(
            (data) => {
              const index = this.favouriteQuery!.results.findIndex((f) => f.id === favourite.id)
              this.favouriteQuery!.results[index] = data
            }
          )
        }
      }
    }).catch((error) => {
      console.log(error)
    })
  }

  favouriteValueEdit(name: string, type: string) {
    const ref = this.modal.open(JobMetadataCreationModalComponent, {scrollable: true})
    ref.componentInstance.name = name
    ref.componentInstance.type = type
    if (name === "Modification parameters") {
      ref.componentInstance.allowMultipleSpecSelection = false
    }
    ref.result.then((result: any[]) => {
      if (result) {
        for (const r of result) {
          let value = r.metadataValue
          value = this.metadata.tranformMetadataValue(r, value);
          this.formFavourite.controls.value.setValue(value)
          if (!this.formFavourite.value.displayName) {
            this.formFavourite.controls.displayName.setValue(value)
          }
          /*const payload: any = {name: name, type: type, value: value, display_name: value}
          this.web.createFavouriteMetadataOption(payload).subscribe(
            (data) => {
              this.justCreatedFavourite = data
              this.getFavourites()
            }
          )*/
        }
      }
    }).catch((error) => {
      console.log(error)
    })
  }

  createFavourite() {
    if (this.formFavourite.value.name && this.formFavourite.value.value && this.formFavourite.value.displayName) {
      const payload: any = {
        name: this.formFavourite.value.name,
        type: this.formFavourite.value.type,
        value: this.formFavourite.value.value,
        display_name: this.formFavourite.value.displayName
      }
      if (this.formFavourite.value.mode === "service_lab_group") {
        payload["service_lab_group"] = this.formLabGroup.controls.service_lab_group.value
        this.web.createFavouriteMetadataOption(payload).subscribe(
          (data) => {
            this.justCreatedFavourite = data
            this.getFavourites(this.form.value.searchTerm)
          }
        )
      } else {
        this.web.createFavouriteMetadataOption(payload).subscribe(
          (data) => {
            this.justCreatedFavourite = data
            this.getFavourites(this.form.value.searchTerm)
          }
        )
      }

    }
  }
}
