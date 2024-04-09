import {Component, Input} from '@angular/core';
import {Annotation} from "../../annotation";
import {FormBuilder, FormsModule} from "@angular/forms";
import {WebService} from "../../web.service";
import {ToastService} from "../../toast.service";

@Component({
  selector: 'app-table-presenter',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './table-presenter.component.html',
  styleUrl: './table-presenter.component.scss'
})
export class TablePresenterComponent {
  _annotation?: Annotation;
  data: {name: string, nRow: number, nCol: number, content: any[][]} = {name: "", nRow: 0, nCol: 0, content: []};
  segments: any[][] = [];
  @Input() set annotation(value: Annotation) {
    this._annotation = value;
    this.data = JSON.parse(value.annotation)
    this.segments = JSON.parse(JSON.stringify(this.data.content))
  }

  get annotation() {
    return this._annotation!;
  }
  editMode = false;
  constructor(private web: WebService, private toast: ToastService) {
  }

  save() {
    this.data.content = JSON.parse(JSON.stringify(this.segments))
    this.annotation.annotation = JSON.stringify(this.data)
    this.web.updateAnnotation(this.annotation.annotation, "table", this.annotation.id).subscribe(() => {
      this.toast.show("Table", "Table updated successfully")
    })
  }

}
