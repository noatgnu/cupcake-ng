import { Component } from '@angular/core';
import {Instrument, InstrumentQuery} from "../../instrument";
import {FormBuilder, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {WebService} from "../../web.service";
import {DataService} from "../../data.service";
import {NgbModal, NgbPagination, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {InstrumentBookingModalComponent} from "../instrument-booking-modal/instrument-booking-modal.component";
import {ToastService} from "../../toast.service";
import {AccountsService} from "../../accounts/accounts.service";
import {InstrumentCreateModalComponent} from "../instrument-create-modal/instrument-create-modal.component";
import {InstrumentManagementModalComponent} from "../instrument-management-modal/instrument-management-modal.component";
import {
  InstrumentMetadataManagementModalComponent
} from "../instrument-metadata-management-modal/instrument-metadata-management-modal.component";

@Component({
  selector: 'app-instrument-management',
  standalone: true,
  imports: [
    FormsModule,
    NgbPagination,
    ReactiveFormsModule,
    NgbTooltip
  ],
  templateUrl: './instrument-management.component.html',
  styleUrl: './instrument-management.component.scss'
})
export class InstrumentManagementComponent {

  pageSize = 5
  currentInstrumentPage = 1

  instrumentQuery?: InstrumentQuery
  form = this.fb.group({
    searchTerm: ['']
  })

  constructor(private fb: FormBuilder, private web: WebService, public dataService: DataService, private modal: NgbModal, private toastService: ToastService, public accounts: AccountsService) {
    this.web.getInstruments().subscribe((data: any) => {
      this.instrumentQuery = data
    })
    this.form.controls.searchTerm.valueChanges.subscribe((value: string| null) => {
      if (value) {
        this.web.getInstruments(undefined, this.pageSize, 0, value).subscribe((data: InstrumentQuery) => {
          this.instrumentQuery = data
          this.getInstrumentPermission()
        })
      }
    })
  }

  handlePageChange(event: any) {
    if (this.form.controls.searchTerm.value) {
      this.web.getInstruments(undefined, this.pageSize, (event.page - 1) * this.pageSize, this.form.controls.searchTerm.value).subscribe((data: InstrumentQuery) => {
        this.instrumentQuery = data
        this.getInstrumentPermission()
      })
    } else {
      this.web.getInstruments(undefined, this.pageSize, (event.page - 1) * this.pageSize).subscribe((data: InstrumentQuery) => {
        this.instrumentQuery = data
        this.getInstrumentPermission()
      })
    }
  }

  clickInstrument(instrument: Instrument) {
    if (this.dataService.instrumentPermissions[instrument.id].can_manage || this.accounts.is_staff) {
      const ref = this.modal.open(InstrumentManagementModalComponent, {scrollable: true})
      ref.componentInstance.instrument = instrument
      ref.closed.subscribe((data: any) => {
        this.web.assignInstrumentPermission(data.instrument.id, data.username, data.permissions).subscribe((data) => {
          this.toastService.show("Instrument permission", "Successfully assigned permission")
        }, (error) => {
          this.toastService.show("Instrument permission", "Failed to assign permission")
        })
      })
    } else{
      this.toastService.show("Instrument permission", "You do not have permission for this instrument")
    }
  }

  getInstrumentPermission() {
    for (let instrument of this.instrumentQuery!.results) {
      this.web.getInstrumentPermission(instrument.id).subscribe((data) => {
        this.dataService.instrumentPermissions[instrument.id] = data
      }, (error) => {
        this.dataService.instrumentPermissions[instrument.id] = {can_view: false, can_book: false, can_manage: false}
      }, () => {

      })
    }
  }

  openInstrumentCreateModal() {
    const ref = this.modal.open(InstrumentCreateModalComponent, {scrollable: true})
    ref.closed.subscribe((data: any) => {
      this.web.createInstrument(data.name, data.description).subscribe((instrument) => {
        this.web.getInstruments().subscribe((data: any) => {
          this.instrumentQuery = data
          this.getInstrumentPermission()
        })
      })
    })
  }

  manageMetadata(instrument: Instrument) {
    const ref = this.modal.open(InstrumentMetadataManagementModalComponent, {scrollable: true})
    ref.componentInstance.instrument = instrument

  }

}
