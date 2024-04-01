import {Component, Input} from '@angular/core';
import {Annotation} from "../../annotation";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-transcribe-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './transcribe-modal.component.html',
  styleUrl: './transcribe-modal.component.scss'
})
export class TranscribeModalComponent {
  _annotation?: Annotation
  @Input() set annotation(value: Annotation) {
    this._annotation = value
  }
  get annotation(): Annotation {
    return this._annotation!
  }

  form = this.fb.group({
    language: ['auto'],
    model: ['medium']
  })

  constructor(private modal: NgbActiveModal, private fb: FormBuilder) {

  }

  close() {
    this.modal.dismiss()
  }

  submit() {
    this.modal.close(this.form.value)
  }


}
