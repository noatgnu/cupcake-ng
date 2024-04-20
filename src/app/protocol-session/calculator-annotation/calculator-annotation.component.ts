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
  operation: '+' | '-' | '*' | '/' | '^' | null = null

  form = this.fb.group({
    inputPromptFirstValue: new FormControl<string>("", Validators.required),
    inputPromptSecondValue: new FormControl<string>("", Validators.required),
  })

  dataLog: {inputPromptFirstValue: number, inputPromptSecondValue: number, operation: string, result: number}[] = []

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

  formOperation(operation: '+'|'-'|'*'|'/'| '='| 'log2' | 'log10' | 'sqrt' | 'abs' | '^') {
    if (this.executionMode === 'initial') {
      if (operation === '=' || this.form.controls.inputPromptFirstValue.value === "") {
        return
      }
      if (operation === 'log2' || operation === 'log10' || operation === 'sqrt' || operation === 'abs') {
        // @ts-ignore
        let data = {inputPromptFirstValue: parseFloat(this.form.controls.inputPromptFirstValue.value), inputPromptSecondValue: 0, operation: operation, result: 0}
        switch (operation) {
          case 'log2':
            // @ts-ignore
            data.result = Math.log2(parseFloat(this.form.controls.inputPromptFirstValue.value))
            this.form.controls.inputPromptFirstValue.setValue(data.result.toString())

            break
          case 'log10':
            // @ts-ignore
            data.result = Math.log10(parseFloat(this.form.controls.inputPromptFirstValue.value))
            this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
            break
          case 'sqrt':
            // @ts-ignore
            data.result = Math.sqrt(parseFloat(this.form.controls.inputPromptFirstValue.value))
            this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
            break
          case 'abs':
            // @ts-ignore
            data.result = Math.abs(parseFloat(this.form.controls.inputPromptFirstValue.value))
            this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
            break
        }
        this.dataLog.push(data)
        return;
      }
      this.executionMode = 'second'
      this.operation = operation
    } else {
      if (operation === '=' || this.form.controls.inputPromptSecondValue.value === "") {
        return
      }
      // @ts-ignore
      let data = {inputPromptFirstValue: parseFloat(this.form.controls.inputPromptFirstValue.value), inputPromptSecondValue: parseFloat(this.form.controls.inputPromptSecondValue.value), operation: this.operation!, result: 0}
      switch (this.operation) {
        case '+':
          // @ts-ignore
          data.result = parseFloat(this.form.controls.inputPromptFirstValue.value) + parseFloat(this.form.controls.inputPromptSecondValue.value)
          this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
          break
        case '-':
          // @ts-ignore
          data.result = parseFloat(this.form.controls.inputPromptFirstValue.value) - parseFloat(this.form.controls.inputPromptSecondValue.value)
          this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
          break
        case '*':
          // @ts-ignore
          data.result = parseFloat(this.form.controls.inputPromptFirstValue.value) * parseFloat(this.form.controls.inputPromptSecondValue.value)
          this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
          break
        case '/':
          // @ts-ignore
          data.result = parseFloat(this.form.controls.inputPromptFirstValue.value) / parseFloat(this.form.controls.inputPromptSecondValue.value)
          this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
          break
        case '^':
          // @ts-ignore
          data.result = Math.pow(parseFloat(this.form.controls.inputPromptFirstValue.value), parseFloat(this.form.controls.inputPromptSecondValue.value))
          this.form.controls.inputPromptFirstValue.setValue(data.result.toString())
          break
      }
      this.operation = null
      this.executionMode = 'initial'
      this.dataLog.push(data)
    }
  }
}
