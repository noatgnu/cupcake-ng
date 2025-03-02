import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";

@Component({
    selector: 'app-delete-folder-modal',
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './delete-folder-modal.component.html',
    styleUrl: './delete-folder-modal.component.scss'
})
export class DeleteFolderModalComponent {

  form = this.fb.group(
    {
      remove_content: false
    }
  )

  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder) {
  }

  close() {
    this.activeModal.dismiss()
  }

  delete() {
    this.activeModal.close(this.form.value.remove_content)
  }
}
