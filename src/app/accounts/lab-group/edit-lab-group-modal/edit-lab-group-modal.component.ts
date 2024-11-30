import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {LabGroup} from "../../../lab-group";

@Component({
  selector: 'app-edit-lab-group-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './edit-lab-group-modal.component.html',
  styleUrl: './edit-lab-group-modal.component.scss'
})
export class EditLabGroupModalComponent {
  @Input() labGroup!: LabGroup

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  })

  constructor(private modal: NgbActiveModal, private fb: FormBuilder) { }

  close() {
    this.modal.dismiss()
  }

  submit() {
    if (this.labGroup) {
      this.modal.close({id: this.labGroup.id, name: this.form.value.name, description: this.form.value.description})
    } else {
      this.modal.close({name: this.form.value.name, description: this.form.value.description})
    }
  }

}
