import {Component, Input} from '@angular/core';
import {NgbActiveModal, NgbTypeahead} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {Instrument} from "../../instrument";
import {WebService} from "../../web.service";
import {AccountsService} from "../../accounts/accounts.service";
import {ToastService} from "../../toast.service";
import {debounceTime, map, Observable, switchMap} from "rxjs";
import {User} from "../../user";

@Component({
    selector: 'app-instrument-management-modal',
  imports: [
    ReactiveFormsModule,
    NgbTypeahead
  ],
    templateUrl: './instrument-management-modal.component.html',
    styleUrl: './instrument-management-modal.component.scss'
})
export class InstrumentManagementModalComponent {
  currentUser: User | null = null
  private _instrument?: Instrument

  @Input() set instrument(value: Instrument) {
    this._instrument = value
  }

  get instrument(): Instrument {
    return this._instrument!
  }

  formUser = this.fb.group({
    username: [""],
  })

  userList: User[] = []
  permissionMap: {[key: string]: {can_book: boolean, can_manage: boolean, can_view: boolean}} = {}

  formPermissions!:FormGroup<{can_book: FormControl<boolean>, can_manage: FormControl<boolean>, can_view: FormControl<boolean>}>
  constructor(private toastService: ToastService, private activeModal: NgbActiveModal, private fb: FormBuilder, private web: WebService, public accounts: AccountsService) {
    this.formUser.controls.username.valueChanges.subscribe((value) => {
      if (value) {
        this.web.getUsers(undefined, 5, 0, value).subscribe((data) => {
          this.userList = data.results
          for (const user of this.userList) {
            this.web.getUserInstrumentPermission(this.instrument.id, user.username).subscribe((data) => {
              this.permissionMap[user.username] = data
            })
          }
        })
      }
    })
  }



  getUserPermission(user: string) {
    const currentUser = this.userList.find((u) => u.username === user)
    if (currentUser) {
      this.currentUser = currentUser
    }
    this.web.getUserInstrumentPermission(this.instrument.id, user).subscribe((data) => {
      // @ts-ignore
      this.formPermissions = this.fb.group({
        can_book: new FormControl(data.can_book),
        can_manage: new FormControl(data.can_manage),
        can_view: new FormControl(data.can_view),
      })
    }, (error) => {
      this.toastService.show("Instrument Permission", "User not found")
    })
  }

  close() {
    this.activeModal.dismiss()
  }

  submit() {
    if (this.currentUser) {
      this.activeModal.close({permissions: this.formPermissions.value, username: this.currentUser.username, instrument: this.instrument})
    } else {
      this.toastService.show("Instrument Permission", "User not selected")
    }
  }

}
