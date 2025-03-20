import { Component } from '@angular/core';
import {WebService} from "../../web.service";
import {FormBuilder} from "@angular/forms";
import {FavouriteMetadataOptionQuery} from "../../favourite-metadata-option";
import {NgbPagination} from "@ng-bootstrap/ng-bootstrap";
import {forkJoin} from "rxjs";
import {User} from "../../user";
import {LabGroup} from "../../lab-group";

@Component({
  selector: 'app-favourites',
  imports: [
    NgbPagination
  ],
  templateUrl: './favourites.component.html',
  styleUrl: './favourites.component.scss'
})
export class FavouritesComponent {
  page = 1
  pageSize = 10;

  favouriteQuery: FavouriteMetadataOptionQuery| undefined = undefined;

  form = this.fb.group({
    searchTerm: [""]
  })

  userMap: { [key: number]: User } = {}
  labGroupMap: { [key: number]: LabGroup } = {}

  constructor(private web: WebService, private fb: FormBuilder) {
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
        if (f.lab_group) {
          if (!labGroupIDs.includes(f.lab_group)) {
            labGroupIDs.push(f.lab_group)
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
}
