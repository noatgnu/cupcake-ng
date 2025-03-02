import {Component, Input} from '@angular/core';
import {Annotation} from "../../annotation";

@Component({
    selector: 'app-randomization-presenter',
    imports: [],
    templateUrl: './randomization-presenter.component.html',
    styleUrl: './randomization-presenter.component.scss'
})
export class RandomizationPresenterComponent {
  private _annotation?: Annotation

  data: {numberArray: any[], sampleArray: any[], form: {
    samples: string,
      nCol: number,
      nRow: number,
    generateNumber: boolean,
    numberMax: number,
    numberMin: number
    }} = {numberArray: [], sampleArray: [], form: {
    samples: "",
    nCol: 0,
    nRow: 0,
    generateNumber: false,
    numberMax: 0,
    numberMin: 0
    }}

  @Input() set annotation(value: Annotation) {
    this._annotation = value
    this.data = JSON.parse(value.annotation)
  }

  get annotation(): Annotation {
    return this._annotation!
  }

  constructor() {

  }
}
