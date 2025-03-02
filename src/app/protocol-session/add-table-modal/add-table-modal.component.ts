import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";

@Component({
    selector: 'app-add-table-modal',
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './add-table-modal.component.html',
    styleUrl: './add-table-modal.component.scss'
})
export class AddTableModalComponent {

  form = this.fb.group({
    nRow: 1,
    nCol: 1,
    name: '',
  })

  constructor(private fb: FormBuilder, private activeModal: NgbActiveModal) {
  }

  close() {
    this.activeModal.dismiss()
  }

  save() {
    this.activeModal.close(this.form.value)
  }
}
