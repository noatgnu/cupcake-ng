import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-job-template-creation-modal',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './job-template-creation-modal.component.html',
  styleUrl: './job-template-creation-modal.component.scss'
})
export class JobTemplateCreationModalComponent {
  form = this.fb.group({
    name: [''],
  })

  constructor(private modal: NgbActiveModal, private fb: FormBuilder) {
  }

  close() {
    this.modal.dismiss()
  }

  save() {
    this.modal.close(this.form.value)
  }
}
