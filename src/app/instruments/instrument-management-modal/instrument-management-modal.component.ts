import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder} from "@angular/forms";
import {Instrument} from "../../instrument";
import {WebService} from "../../web.service";

@Component({
  selector: 'app-instrument-management-modal',
  standalone: true,
  imports: [],
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
    can_book: [false],
    can_manage: [false],
    can_view: [false],
  })
  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder, private web: WebService) {

  }

  getInstrumentPermission(){
    this.web.getInstrumentPermission(this.instrument.id).subscribe((data) => {

    })
  }

}
