import {Component, EventEmitter, Output} from '@angular/core';
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";

import {QuillEditorComponent} from "ngx-quill";

@Component({
    selector: 'app-annotation-text-form',
    imports: [
        ReactiveFormsModule,
        QuillEditorComponent
    ],
    templateUrl: './annotation-text-form.component.html',
    styleUrl: './annotation-text-form.component.scss'
})
export class AnnotationTextFormComponent {
  form = this.fb.group({
    text: new FormControl('', Validators.required),
  })

  editorConfig = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block'],

        [{ 'header': 1 }, { 'header': 2 }],               // custom button values
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
        [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        [{ 'direction': 'rtl' }],                         // text direction
        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'align': [] }],

        ['clean'],                                         // remove formatting button

        ['link', 'image', 'video']                         // link and image, video
      ]
    }
  }
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
