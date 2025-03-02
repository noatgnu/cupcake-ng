import {Component, Input} from '@angular/core';
import {
  NgbActiveModal,
  NgbDropdown,
  NgbDropdownButtonItem, NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle
} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {WebService} from "../../../web.service";
import {Protocol, ProtocolStep} from "../../../protocol";
import {ProtocolSession} from "../../../protocol-session";
import {Router} from "@angular/router";

@Component({
    selector: 'app-step-metadata-exporter-modal',
    imports: [
        ReactiveFormsModule,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownItem
    ],
    templateUrl: './step-metadata-exporter-modal.component.html',
    styleUrl: './step-metadata-exporter-modal.component.scss'
})
export class StepMetadataExporterModalComponent {
  @Input() session?: ProtocolSession
  @Input() protocol?: Protocol
  @Input() step?: ProtocolStep

  private _data: {
    column_position: number, name: string, type: string, value: string|null, not_applicable: boolean
  }[] = []
  @Input() set data(value: {
    column_position: number, name: string, type: string, value: string|null, not_applicable: boolean
  }[]) {
    this._data = value
    for (const row of value) {
      this.form.push(this.fb.group({
        column_position: row.column_position,
        name: row.name,
        type: row.type,
        value: row.value,
        not_applicable: row.not_applicable
      }))
    }
  }

  get data(): {
    column_position: number, name: string, type: string, value: string|null, not_applicable: boolean
  }[] {
    return this._data
  }

  form = this.fb.array<FormGroup>([])

  constructor(private modal: NgbActiveModal, private fb: FormBuilder, private web: WebService, private router: Router) {

  }

  close() {
    this.modal.dismiss()
  }

  submit() {
    this.modal.close(this.data)
  }

  exportAs(exportType: string) {
    switch (exportType) {
      case "cinder-clipboard":
        const payload = this.form.value
        navigator.clipboard.writeText(JSON.stringify(payload))
        break
      case "txt":
        if (this.step) {
          this.web.convertMetadataToSDRFTxt(this.step.id, this.form.value).subscribe((data) => {
            console.log(data)
          })
        }
        break
      case "cupcake-reagent":
        if (this.step && this.session && this.protocol) {
          localStorage.setItem("metadata-cupcake-reagent", JSON.stringify({metadata: this.form.value, step: this.step, session: this.session, protocol: this.protocol}))
          // open new tab at #/reagent-store
          window.open('/#/reagent-store', '_blank');
        }
        break

    }
  }
}
