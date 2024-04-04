import {Component, Input} from '@angular/core';
import {Annotation} from "../../annotation";
import {FormBuilder, FormsModule} from "@angular/forms";
import {WebService} from "../../web.service";

@Component({
  selector: 'app-checklist-presenter',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './checklist-presenter.component.html',
  styleUrl: './checklist-presenter.component.scss'
})
export class ChecklistPresenterComponent {
  _annotation?: Annotation

  @Input() set annotation(value: Annotation) {
    this._annotation = value
    this.data = JSON.parse(value.annotation)
  }

  get annotation(): Annotation {
    return this._annotation!
  }

  data: {name: string, checkList: {checked: boolean, content: string}[]} = {name: "", checkList: []}

  constructor(private web: WebService, private fb: FormBuilder) {
  }

}
