import {Component, EventEmitter, Output} from '@angular/core';
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgxWigModule} from "ngx-wig";

@Component({
  selector: 'app-annotation-text-form',
  standalone: true,
  imports: [
    NgxWigModule,
    ReactiveFormsModule
  ],
  templateUrl: './annotation-text-form.component.html',
  styleUrl: './annotation-text-form.component.scss'
})
export class AnnotationTextFormComponent {
  form = this.fb.group({
    text: new FormControl('', Validators.required),
  })
  @Output() text: EventEmitter<string> = new EventEmitter<string>()
  constructor(private fb: FormBuilder) {

  }

  submit() {
    if (this.form.valid) {
      if (this.form.value.text) {
        this.text.emit(this.form.value.text)
      }
    }
  }

}
