import {Component, Input} from '@angular/core';
import {Instrument} from "../../../instrument";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";

@Component({
  selector: 'app-instrument-editor-modal',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './instrument-editor-modal.component.html',
  styleUrl: './instrument-editor-modal.component.scss'
})
export class InstrumentEditorModalComponent {
  private _instrument: Instrument|undefined
  @Input() set instrument(value: Instrument) {
    this._instrument = value
    this.form.patchValue({
      name: value.instrument_name,
      description: value.instrument_description,
      max_days_ahead: value.max_days_ahead_pre_approval,
      max_duration: value.max_days_within_usage_pre_approval,
    })
  }

  get instrument(): Instrument {
    return this._instrument!
  }

  form = this.fb.group({
    name: this.fb.control('', [Validators.required]),
    description: this.fb.control('',),
    max_days_ahead: this.fb.control(0, [Validators.required]),
    max_duration: this.fb.control(0, [Validators.required]),
  })

  constructor(private modal: NgbActiveModal, private fb: FormBuilder) {
  }

  close() {
    this.modal.dismiss()
  }

  submit() {
    if (this.form.valid) {
      this.modal.close(this.form.value)
    }
  }

}
