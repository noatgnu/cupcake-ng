import {Component, Input} from '@angular/core';
import {Annotation} from "../../annotation";
import {WebService} from "../../web.service";
import {FormBuilder} from "@angular/forms";

@Component({
  selector: 'app-counter-presenter',
  standalone: true,
  imports: [],
  templateUrl: './counter-presenter.component.html',
  styleUrl: './counter-presenter.component.scss'
})
export class CounterPresenterComponent {
  _annotation?: Annotation

  @Input() set annotation(value: Annotation) {
    this._annotation = value
    this.data = JSON.parse(value.annotation)
  }

  get annotation(): Annotation {
    return this._annotation!
  }

  data: {name: string, total: number, current: number} = {name: "", total: 0, current: 0}

  form = this.fb.group({

  })

  constructor(private web: WebService, private fb: FormBuilder) {

  }

  updateAnnotation() {

  }

}
