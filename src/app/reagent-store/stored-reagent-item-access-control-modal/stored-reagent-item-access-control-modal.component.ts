import {Component, Input} from '@angular/core';
import {WebService} from "../../web.service";
import {
  NgbActiveModal,
  NgbNav,
  NgbNavContent, NgbNavItem,
  NgbNavLinkButton,
  NgbNavOutlet, NgbPagination,
  NgbTypeahead
} from "@ng-bootstrap/ng-bootstrap";
import {User, UserQuery} from "../../user";
import {FormBuilder, FormControl, ReactiveFormsModule} from "@angular/forms";
import {debounceTime, Observable, of, switchMap} from "rxjs";
import {StoredReagent} from "../../storage-object";
import {LabGroup, LabGroupQuery} from "../../lab-group";

@Component({
    selector: 'app-stored-reagent-item-access-control-modal',
    imports: [
        ReactiveFormsModule,
        NgbNavOutlet,
        NgbNavContent,
        NgbNavLinkButton,
        NgbNav,
        NgbNavItem,
        NgbPagination
    ],
    templateUrl: './stored-reagent-item-access-control-modal.component.html',
    styleUrl: './stored-reagent-item-access-control-modal.component.scss'
})
export class StoredReagentItemAccessControlModalComponent {
  activeID = "user"
  private _storedReagent!: StoredReagent
  @Input() set storedReagent(value: StoredReagent) {
    this._storedReagent = value
    this.getCurrentAccessUsers()
    this.getCurrentAccessLabGroups()
  }

  get storedReagent(): StoredReagent {
    return this._storedReagent
  }

  userQuery!: UserQuery
  labQuery!: LabGroupQuery

  form = this.fb.group({
    username: new FormControl<string>(""),
    id: new FormControl<number|null>(null)
  })

  formLabGroup = this.fb.group({
    name: new FormControl<string>(""),
    id: new FormControl<number|null>(null)
  })

  reagentUserAccess!: UserQuery
  reagentLabGroupAccess!: LabGroupQuery

  currentUserPage = 0
  currentLabGroupPage = 0

  constructor(private web: WebService, private activeModal: NgbActiveModal, private fb: FormBuilder) {
    this.form.controls.username.valueChanges.pipe(
      debounceTime(300),
      switchMap((value)=> {
        if (value) {
          return this.web.getUsers(undefined, 10, 0, value)
        } else {
          return of()
        }
      })
    ).subscribe((users) => {
      this.userQuery = users
    })
    this.formLabGroup.controls.name.valueChanges.pipe(
      debounceTime(300),
      switchMap((value) => {
        if (value) {
          return this.web.getLabGroups(value, 10, 0)
        } else {
          return of()
        }
      })
    ).subscribe((labGroups) => {
      this.labQuery = labGroups
    })
  }

  close() {
    this.activeModal.dismiss()
  }

  addUser(user: User) {
    if (this._storedReagent) {
      this.web.addAccessUserToStoredReagent(this.storedReagent.id, user.username).subscribe((data) => {
        this.getCurrentAccessUsers()
      })
    }
  }

  removeUser(user: User) {
    if (this._storedReagent) {
      this.web.removeAccessUserFromStoredReagent(this.storedReagent.id, user.username).subscribe((data) => {
        this.getCurrentAccessUsers()
      })
    }
  }

  addLabGroup(group: LabGroup) {
    if (this._storedReagent) {
      this.web.addAccessGroupToStoredReagent(this._storedReagent.id, group.id).subscribe((data) =>{
        this.getCurrentAccessLabGroups()
      })
    }
  }

  removeLabGroup(group: LabGroup) {
    if (this._storedReagent) {
      this.web.removeAccessGroupFromStoredReagent(this._storedReagent.id, group.id).subscribe((data) => {
        this.getCurrentAccessLabGroups()
      })
    }
  }

  getCurrentAccessUsers(page: number = 0){
    if (this._storedReagent) {
      this.web.getUsersByStoredReagent(this.storedReagent.id, 10, page*10).subscribe((value) => {
        this.reagentUserAccess = value
      })
    }
  }

  pageEvent(event: number) {
    if (this.storedReagent) {
      const page = event -1
      if (this.activeID === "user") {
        this.getCurrentAccessUsers(page)
      } else {
        this.getCurrentAccessLabGroups(page)
      }
    }
  }

  getCurrentAccessLabGroups(page: number = 0) {
    if (this._storedReagent) {
      this.web.getLabGroupsByStoredReagent(this._storedReagent.id, 10, page*10).subscribe((value)=>{
        this.reagentLabGroupAccess = value
      })
    }
  }


}
