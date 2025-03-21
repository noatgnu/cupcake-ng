import { Component } from '@angular/core';
import {WebService} from "../../web.service";
import {FormArray, FormBuilder, FormsModule} from "@angular/forms";
import {FavouriteMetadataOption, FavouriteMetadataOptionQuery} from "../../favourite-metadata-option";
import {
  NgbDropdown,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbModal,
  NgbPagination,
  NgbTooltip
} from "@ng-bootstrap/ng-bootstrap";
import {forkJoin} from "rxjs";
import {User} from "../../user";
import {LabGroup} from "../../lab-group";
import {AccountsService} from "../accounts.service";
import {ExploreMetadataComponent} from "./explore-metadata/explore-metadata.component";
import {
  JobMetadataCreationModalComponent
} from "../../instruments/instrument-job-management/job-metadata-creation-modal/job-metadata-creation-modal.component";
import {MetadataService} from "../../metadata.service";

@Component({
  selector: 'app-favourites',
  imports: [
    NgbPagination,
    NgbTooltip,
    FormsModule,
    ExploreMetadataComponent,
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle
  ],
  templateUrl: './favourites.component.html',
  styleUrl: './favourites.component.scss'
})
export class FavouritesComponent {
  page = 1
  pageSize = 10;

  editableCell: {row: number, col: string} | undefined = undefined;
  currentCell: {row: number, col: string} | undefined = undefined;

  favouriteQuery: FavouriteMetadataOptionQuery| undefined = undefined;

  form = this.fb.group({
    searchTerm: [""]
  })

  userMap: { [key: number]: User } = {}
  labGroupMap: { [key: number]: LabGroup } = {}

  constructor(private metadata: MetadataService, private modal: NgbModal, public accountService: AccountsService, private web: WebService, private fb: FormBuilder) {
    this.getFavourites()
  }

  getFavourites() {
    const offset = (this.page - 1) * this.pageSize
    this.web.getFavouriteMetadataOptions(this.pageSize, offset, this.form.value.searchTerm).subscribe((data: FavouriteMetadataOptionQuery) => {
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
    this.getFavourites()
  }

  removeFavourite(id: number) {
    this.web.deleteFavouriteMetadataOption(id).subscribe(() => {
      this.getFavourites()
    })
  }

  toggleFavouriteGlobal(favourite: FavouriteMetadataOption) {
    this.web.updateFavouriteMetadataOption(favourite.id, {is_global:!favourite.is_global}).subscribe((data) => {
      const index = this.favouriteQuery!.results.findIndex((f) => f.id === favourite.id)
      this.favouriteQuery!.results[index] = data
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
}
