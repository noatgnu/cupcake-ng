import {Component, Input} from '@angular/core';
import {LabGroup} from "../../../lab-group";
import {NgbActiveModal, NgbPagination, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../../web.service";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap} from "rxjs";
import {User, UserQuery} from "../../../user";

@Component({
    selector: 'app-add-remove-user-from-group-modal',
    imports: [
        ReactiveFormsModule,
        NgbPagination,
        NgbTooltip
    ],
    templateUrl: './add-remove-user-from-group-modal.component.html',
    styleUrl: './add-remove-user-from-group-modal.component.scss'
})
export class AddRemoveUserFromGroupModalComponent {
  isLoading = false;
  isActionPending = false;

  userQuery: UserQuery|undefined
  currentLabGroupUserQuery: UserQuery|undefined
  private _labGroup: LabGroup|undefined
  @Input() set labGroup(value: LabGroup|undefined) {
    this._labGroup = value
    if (value) {
      this.getCurrentLabGroupUsers()
      this.getUsers(undefined)
    }
  }

  get labGroup(): LabGroup|undefined {
    return this._labGroup
  }

  form = this.fb.group({
    name: [""]
  })
  currentLabGroupUserPage: number = 0
  userPage: number = 0
  inThisLabGroupMap: {[key: string]: boolean} = {}

  constructor(private modal: NgbActiveModal, private web: WebService, private fb: FormBuilder) {
    this.form.controls.name.valueChanges.pipe(
      debounceTime(300),
      // @ts-ignore
      distinctUntilChanged(),
      switchMap((term: string) => {
        if (!this.labGroup) {
          return of(undefined)
        }
        this.isLoading = true;
        return this.web.getUsers(undefined, 10, 0, term).pipe(
          map((users) => {
            this.isLoading = false;
            return users
          }), catchError(() => {
            this.isLoading = false;
            return of(undefined)
          })
        )
      })
    ).subscribe((users) => {
      this.userQuery = users
    })


  }

  close() {
    this.modal.close()
  }

  getUsers(searchTerm: string|undefined|null) {
    this.web.getUsers(undefined, 10, (this.userPage-1)*10, searchTerm).subscribe((users) => {
      this.userQuery = users
      if (this.labGroup) {
        for (const user of users.results) {
          this.inThisLabGroupMap[user.id] = false
          for (const l of user.lab_groups) {
            if (l.id === this.labGroup.id) {
              this.inThisLabGroupMap[user.id] = true
              break
            }
          }
        }
      }
      console.log(this.inThisLabGroupMap)

    })
  }

  searchUser = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((term: string) => {
        if (!this.labGroup) {
          return of([])
        }
        return this.web.getUsers(undefined, 10, 0, term).pipe(
          map((users) => {
            return users.results
          })
        )
      })
    )
  }

  getCurrentLabGroupUsers() {
    if (this.labGroup) {
      this.web.getUsersByLabGroup(this.labGroup.id, 10, (this.currentLabGroupUserPage-1)*10, this.form.value.name).subscribe((users) => {
        this.currentLabGroupUserQuery = users
      })
    }
  }

  handleLabGroupUserPageChange(page: number) {
    this.currentLabGroupUserPage = page
    this.getCurrentLabGroupUsers()
  }

  handleUserPageChange(page: number) {
    this.userPage = page
    if (this.form.controls.name.value) {
      this.getUsers(this.form.controls.name.value)
    } else {
      this.getUsers(undefined)
    }
  }

  addUserToLabGroup(user: User) {
    if (this.labGroup) {
      this.isActionPending = true;
      this.web.addLabGroupMember(this.labGroup.id, user.id).subscribe(() => {
        this.getCurrentLabGroupUsers()
        this.getUsers(this.form.value.name)
        this.isActionPending = false;
      }, () => {
        this.isActionPending = false;
      })
    }
  }

  removeUserFromLabGroup(user: User) {
    if (this.labGroup) {
      this.isActionPending = true;
      this.web.removeLabGroupMember(this.labGroup.id, user.id).subscribe(() => {
        this.getCurrentLabGroupUsers()
        this.getUsers(this.form.value.name)
        this.isActionPending = false;
      }, () => {
        this.isActionPending = false;
      })
    }
  }
}
