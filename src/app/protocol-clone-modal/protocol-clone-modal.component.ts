import {Component, Input} from '@angular/core';
import {Protocol} from "../protocol";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {WebService} from "../web.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {QuillEditorComponent} from "ngx-quill";

@Component({
    selector: 'app-protocol-clone-modal',
    imports: [
        ReactiveFormsModule,
        QuillEditorComponent
    ],
    templateUrl: './protocol-clone-modal.component.html',
    styleUrl: './protocol-clone-modal.component.scss'
})
export class ProtocolCloneModalComponent {
  private _protocol?: Protocol;
  @Input() set protocol(value: Protocol) {
    this._protocol = value;
    this.form.patchValue({
      protocol_title: this.protocol.protocol_title,
      protocol_description: this.protocol.protocol_description
    })
  }

  get protocol(): Protocol {
    return this._protocol!;
  }

  form = this.fb.group(
    {
      protocol_title: [""],
      protocol_description: [""]
    }
  )

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

  constructor(private fb: FormBuilder, private web: WebService, private activeModal: NgbActiveModal) {
  }

  cancel() {
    this.activeModal.dismiss()
  }

  clone() {
    // @ts-ignore
    this.web.cloneProtocol(this.protocol.id, this.form.value.protocol_title, this.form.value.protocol_description).subscribe((data) => {
      window.open(`/#/protocol-session/${data.id}`, "_blank")
    })
  }
}
