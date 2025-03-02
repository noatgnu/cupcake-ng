import {Component, Input} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {WebService} from "../../../web.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Annotation} from "../../../annotation";

@Component({
    selector: 'app-annotation-rename-modal',
    imports: [
        ReactiveFormsModule
    ],
    templateUrl: './annotation-rename-modal.component.html',
    styleUrl: './annotation-rename-modal.component.scss'
})
export class AnnotationRenameModalComponent {
  private _annotation?: Annotation
  @Input() set annotation(value: Annotation) {
    this._annotation = value
    this.form.patchValue({name: value.annotation_name})
  }
  get annotation(): Annotation {
    return this._annotation!
  }

  form = this.fb.group({
    name: ['', Validators.required]
  })

  constructor(private fb: FormBuilder, private activeModal: NgbActiveModal) {
  }

  submit() {
    if (this.form.valid) {
      this.activeModal.close(this.form.value.name)
    }
  }

  cancel() {
    this.activeModal.dismiss()
  }
}
