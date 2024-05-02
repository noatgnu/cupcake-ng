import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {Annotation} from "../../annotation";
import {WebService} from "../../web.service";

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
  @Input() enableSave: boolean = false
  private _annotation?: Annotation
  @Input() set annotation(value: Annotation) {
    this._annotation = value
    const data = JSON.parse(this.annotation.annotation)
    if (Object.keys(data).length === 0) {
      this.dataLog = []
      return
    }
    this.dataLog = JSON.parse(this.annotation.annotation)
  }

  get annotation(): Annotation {
    return this._annotation!
  }
  @Output() change: EventEmitter<Annotation> = new EventEmitter<Annotation>()
  executionMode: 'initial' | 'second' | 'operation' = 'initial'
  operation: '+' | '-' | '*' | '/' | '^' | null = null

  form = this.fb.group({
    inputPromptFirstValue: new FormControl<string>("", Validators.required),
    inputPromptSecondValue: new FormControl<string>("", Validators.required),
  })

  dataLog: {inputPromptFirstValue: number, inputPromptSecondValue: number, operation: string, result: number, scratch: boolean}[] = []

  constructor(private fb: FormBuilder, private web: WebService) {

  }

  formNumber(inputNumber: number) {
    console.log(inputNumber, this.executionMode)
    if (this.executionMode === 'initial') {
      const firstValue = this.form.controls.inputPromptFirstValue.value
      if (firstValue) {
        if (firstValue === "") {
          this.form.controls.inputPromptFirstValue.setValue(inputNumber.toString())
        } else if (firstValue.endsWith(".")) {
          this.form.controls.inputPromptFirstValue.setValue(firstValue + inputNumber.toString())
        } else {
          // @ts-ignore
          this.form.controls.inputPromptFirstValue.setValue((parseFloat(this.form.controls.inputPromptFirstValue.value)  * 10 + inputNumber).toString())
        }
      } else {
        this.form.controls.inputPromptFirstValue.setValue(inputNumber.toString())
      }

    } else if (this.executionMode === 'second') {
      const secondValue = this.form.controls.inputPromptSecondValue.value
      if (secondValue) {
        if (secondValue === "") {
          this.form.controls.inputPromptSecondValue.setValue(inputNumber.toString())
        } else if (secondValue.endsWith(".")) {
          this.form.controls.inputPromptSecondValue.setValue(secondValue + inputNumber.toString())
        } else {
          // @ts-ignore
          this.form.controls.inputPromptSecondValue.setValue((parseFloat(this.form.controls.inputPromptSecondValue.value)  * 10 + inputNumber).toString())
        }
      } else {
        this.form.controls.inputPromptSecondValue.setValue(inputNumber.toString())
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

  formOperation(operation: '+'|'-'|'*'|'/'| '='| 'log2' | 'log10' | 'sqrt' | 'abs' | '^' | 'clr') {
    if (operation === 'clr') {
      this.form.controls.inputPromptFirstValue.setValue('')
      this.form.controls.inputPromptSecondValue.setValue('')
      this.executionMode = 'initial'
      this.operation = null
      return
    }
    if (this.executionMode === 'initial') {
      if (operation === '=' || this.form.controls.inputPromptFirstValue.value === "") {
        return
      }
      if (operation === 'log2' || operation === 'log10' || operation === 'sqrt' || operation === 'abs') {
        // @ts-ignore
        let data = {inputPromptFirstValue: parseFloat(this.form.controls.inputPromptFirstValue.value), inputPromptSecondValue: 0, operation: operation, result: 0, scratch: false}
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
      if (this.form.controls.inputPromptSecondValue.value === "") {
        return
      }
      // @ts-ignore
      let data = {inputPromptFirstValue: parseFloat(this.form.controls.inputPromptFirstValue.value), inputPromptSecondValue: parseFloat(this.form.controls.inputPromptSecondValue.value), operation: this.operation!.slice(), result: 0, scratch: false}
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
      this.form.controls.inputPromptSecondValue.setValue('')
      if (operation === '=') {
        this.executionMode = 'initial'
        this.operation = null
      } else{
        if (operation === 'log2' || operation === 'log10' || operation === 'sqrt' || operation === 'abs') {
          return;
        }
        this.operation = operation
      }
      this.dataLog.push(data)
      console.log(this.dataLog)
    }
  }

  formDelete() {
    if (this.executionMode === 'initial') {
      if (this.form.controls.inputPromptFirstValue.value === "") {
        return
      }
      // @ts-ignore
      this.form.controls.inputPromptFirstValue.setValue(this.form.controls.inputPromptFirstValue.value.slice(0, -1))
    } else if (this.executionMode === 'second') {
      if (this.form.controls.inputPromptSecondValue.value === "") {
        return
      }
      // @ts-ignore
      this.form.controls.inputPromptSecondValue.setValue(this.form.controls.inputPromptSecondValue.value.slice(0, -1))
    }
  }

  formSave() {
    this.web.updateAnnotation(JSON.stringify(this.dataLog), 'calculator', this.annotation.id).subscribe(
      (response) => {
        this._annotation = response
        this.change.emit(response)

      }
    )
  }

  revertValueTo(data: {inputPromptFirstValue: number, inputPromptSecondValue: number, operation: string, result: number}) {
    this.form.controls.inputPromptFirstValue.setValue(data.inputPromptFirstValue.toString())
    this.form.controls.inputPromptSecondValue.setValue(data.inputPromptSecondValue.toString())
    if (data.operation === 'log2' || data.operation === 'log10' || data.operation === 'sqrt' || data.operation === 'abs') {
      this.executionMode = 'initial'
      return
    } else {
      this.executionMode = 'second'
      // @ts-ignore
      this.operation = data.operation
    }
  }
}
