import {Component, Input} from '@angular/core';
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-multiple-line-input-modal',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './multiple-line-input-modal.component.html',
  styleUrl: './multiple-line-input-modal.component.scss'
})
export class MultipleLineInputModalComponent {
  @Input() sampleNumber: number = 0

  form = this.fb.group({
    multiLineText: ['']
  })

  constructor(private modal: NgbActiveModal, private fb: FormBuilder) {
    this.form.controls.multiLineText.valueChanges.subscribe(
      (value) => {
        if (value) {
          const lineNumbers = document.getElementById('lineNumbers') as HTMLDivElement;
          const lines = value.split('\n').length;
          lineNumbers.innerHTML = Array(lines).fill(0).map((_, i) => i + 1).join('<br>');
        } else {
          const lineNumbers = document.getElementById('lineNumbers') as HTMLDivElement;
          lineNumbers.innerHTML = '';
        }
      }
    )
  }

  submit() {
    this.modal.close(this.form.value.multiLineText)
  }

  close() {
    this.modal.dismiss()
  }
}
