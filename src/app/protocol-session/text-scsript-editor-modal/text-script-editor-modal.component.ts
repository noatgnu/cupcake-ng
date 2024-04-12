import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-text-script-editor-modal',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './text-script-editor-modal.component.html',
  styleUrl: './text-script-editor-modal.component.scss'
})
export class TextScriptEditorModalComponent {
  @Input() text: string = ''
  constructor(private activeModal: NgbActiveModal) { }

  save() {
    this.activeModal.close(this.text)
  }

  cancel() {
    this.activeModal.dismiss()
  }

}
