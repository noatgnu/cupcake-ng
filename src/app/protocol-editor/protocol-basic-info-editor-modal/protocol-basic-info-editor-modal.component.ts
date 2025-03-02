import {Component, Input} from '@angular/core';
import {WebService} from "../../web.service";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {QuillEditorComponent} from "ngx-quill";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Protocol} from "../../protocol";

@Component({
  selector: 'app-protocol-basic-info-editor-modal',
  imports: [
    ReactiveFormsModule,
    QuillEditorComponent
  ],
  templateUrl: './protocol-basic-info-editor-modal.component.html',
  styleUrl: './protocol-basic-info-editor-modal.component.scss'
})
export class ProtocolBasicInfoEditorModalComponent {
  @Input() set protocol(value: Protocol) {
    this.form.patchValue({
      protocol_title: value.protocol_title,
      protocol_description: value.protocol_description,
      protocol_id: value.id
    })
  }


  form = this.fb.group({
    protocol_title: [''],
    protocol_description: [''],
    protocol_id: [0]
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

  constructor(private web: WebService, private fb: FormBuilder, private activateModal: NgbActiveModal) {

  }

  close() {
    this.activateModal.dismiss()
  }

  save() {
    if (this.form.value) {
      // @ts-ignore
      this.web.updateProtocol(this.form.value.protocol_id, this.form.value.protocol_title, this.form.value.protocol_description, null).subscribe(
        (data) => {
          this.activateModal.close(data)
        }
      )
    }

  }

}
