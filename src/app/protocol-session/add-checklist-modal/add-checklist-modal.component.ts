import { Component } from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: 'app-add-checklist-modal',
    imports: [
        FormsModule,
        ReactiveFormsModule
    ],
    templateUrl: './add-checklist-modal.component.html',
    styleUrl: './add-checklist-modal.component.scss'
})
export class AddChecklistModalComponent {
  form = this.fb.group({
    name: "",
    checkList: "",
  })
  constructor(private modal: NgbActiveModal, private fb: FormBuilder){
  }

  close() {
    this.modal.dismiss()
  }

  submit() {
    this.modal.close(this.form.value)
  }


}
