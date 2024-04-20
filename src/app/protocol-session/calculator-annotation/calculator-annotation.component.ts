import {Component, Input} from '@angular/core';
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {Annotation} from "../../annotation";
import {parse} from "@plussub/srt-vtt-parser";

@Component({
  selector: 'app-calculator-annotation',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './calculator-annotation.component.html',
  styleUrl: './calculator-annotation.component.scss'
})
export class CalculatorAnnotationComponent {
  private _annotation?: Annotation
  @Input() set annotation(value: Annotation) {
    this._annotation = value
  }

  get annotation(): Annotation {
    return this._annotation!
  }

  executionMode: 'initial' | 'second' | 'operation' = 'initial'

  form = this.fb.group({
    inputPromptFirstValue: new FormControl<string>("", Validators.required),
    inputPromptSecondValue: new FormControl<string>("", Validators.required),
    outputResult: new FormControl<number>(0),
    operation: new FormControl<string|null>(null, Validators.required),
  })

  constructor(private fb: FormBuilder) {

  }

  formNumber(inputNumber: number) {
    if (this.executionMode === 'initial') {
      if (this.form.controls.inputPromptFirstValue.value === "") {
        this.form.controls.inputPromptFirstValue.setValue(inputNumber.toString())
      } else {
        // @ts-ignore
        this.form.controls.inputPromptFirstValue.setValue((parseFloat(this.form.controls.inputPromptFirstValue.value)  * 10 + inputNumber).toString())
      }
    } else if (this.executionMode === 'second') {
      if (this.form.controls.inputPromptSecondValue.value === "") {
        this.form.controls.inputPromptSecondValue.setValue(inputNumber.toString())
      } else {
        // @ts-ignore
        this.form.controls.inputPromptSecondValue.setValue((parseFloat(this.form.controls.inputPromptSecondValue.value)  * 10 + inputNumber).toString())
      }
    }
  }

  formDecimal() {
    if (this.executionMode === 'initial') {
      // @ts-ignore
      if (!this.form.controls.inputPromptFirstValue.value.includes('.')) {
        this.form.controls.inputPromptFirstValue.setValue(this.form.controls.inputPromptFirstValue.value + '.')
      }
    } else if (this.executionMode === 'second') {
      // @ts-ignore
      if (!this.form.controls.inputPromptSecondValue.value.includes('.')) {
        this.form.controls.inputPromptSecondValue.setValue(this.form.controls.inputPromptSecondValue.value + '.')
      }
    }
  }

}
