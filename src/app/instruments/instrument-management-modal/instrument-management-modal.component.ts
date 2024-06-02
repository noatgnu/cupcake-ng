import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {Instrument} from "../../instrument";
import {WebService} from "../../web.service";
import {AccountsService} from "../../accounts/accounts.service";
import {ToastService} from "../../toast.service";

@Component({
  selector: 'app-instrument-management-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './instrument-management-modal.component.html',
  styleUrl: './instrument-management-modal.component.scss'
})
export class InstrumentManagementModalComponent {
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

  formPermissions!:FormGroup<{can_book: FormControl<boolean>, can_manage: FormControl<boolean>, can_view: FormControl<boolean>}>
  constructor(private toastService: ToastService, private activeModal: NgbActiveModal, private fb: FormBuilder, private web: WebService, public accounts: AccountsService) {

  }

  getUserPermission() {
    if (this.formUser.controls.username.value) {
      this.web.getUserInstrumentPermission(this.instrument.id, this.formUser.controls.username.value).subscribe((data) => {
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
  }

  close() {
    this.activeModal.dismiss()
  }

  submit() {
    this.activeModal.close({permissions: this.formPermissions.value, username: this.formUser.controls.username.value, instrument: this.instrument})
  }

}
