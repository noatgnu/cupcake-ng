import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {ItemMetadataComponent} from "../../item-metadata/item-metadata.component";

@Component({
    selector: 'app-instrument-create-modal',
    imports: [
        ReactiveFormsModule,
    ],
    templateUrl: './instrument-create-modal.component.html',
    styleUrl: './instrument-create-modal.component.scss'
})
export class InstrumentCreateModalComponent {

  form = this.fb.group({
    name: [""],
    description: [""]
  })

  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder) {
  }

  create() {
    if (this.form.valid) {
      this.activeModal.close(this.form.value)
    }
  }

  close() {
    this.activeModal.dismiss()
  }


}
