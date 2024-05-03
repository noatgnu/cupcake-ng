import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";

@Component({
  selector: 'app-folder-name-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './folder-name-modal.component.html',
  styleUrl: './folder-name-modal.component.scss'
})
export class FolderNameModalComponent {

  form = this.fb.group({
    name: ["", Validators.required]
  })

  constructor(private modal: NgbActiveModal, private fb: FormBuilder) {

  }

  submit() {
    if (this.form.valid) {
      this.modal.close(this.form.value.name)
    }
  }

  close() {
    this.modal.dismiss()
  }


}
