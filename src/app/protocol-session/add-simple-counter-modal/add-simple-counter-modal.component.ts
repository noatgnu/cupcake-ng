import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-add-simple-counter-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './add-simple-counter-modal.component.html',
  styleUrl: './add-simple-counter-modal.component.scss'
})
export class AddSimpleCounterModalComponent {
  form = this.fb.group({
    total: 0,
    name: "",
  })
  constructor(private modal: NgbActiveModal, private fb: FormBuilder) {

  }

  submit() {
    if (this.form.valid) {
      if (this.form.value.total && this.form.value.name) {
        this.modal.close(this.form.value)
      }
    }
  }

  close() {
    this.modal.dismiss()
  }

}
