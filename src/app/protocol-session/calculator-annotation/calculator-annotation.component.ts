import {Component, Input} from '@angular/core';
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {Annotation} from "../../annotation";

@Component({
  selector: 'app-calculator-annotation',
  standalone: true,
  imports: [],
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

  form = this.fb.group({
    inputPromptFirstValue: new FormControl<number>(0, Validators.required),
    inputPromptSecondValue: new FormControl<number>(0, Validators.required),
    outputResult: new FormControl<number>(0),
    operation: new FormControl<string|null>(null, Validators.required),
  })

  constructor(private fb: FormBuilder) {

  }

}
