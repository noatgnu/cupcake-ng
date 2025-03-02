import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Annotation} from "../../annotation";
import {FormBuilder, FormsModule} from "@angular/forms";
import {WebService} from "../../web.service";
import {ToastService} from "../../toast.service";
import {NgClass} from "@angular/common";

@Component({
    selector: 'app-table-presenter',
    imports: [
        FormsModule,
        NgClass
    ],
    templateUrl: './table-presenter.component.html',
    styleUrl: './table-presenter.component.scss'
})
export class TablePresenterComponent {
  _annotation?: Annotation;
  data: {name: string, nRow: number, nCol: number, content: any[][], tracking: boolean, trackingMap: any} =
    {name: "", nRow: 0, nCol: 0, content: [], tracking: false, trackingMap: {}};
  segments: any[][] = [];
  @Input() set annotation(value: Annotation) {
    this._annotation = value;
    this.data = JSON.parse(value.annotation)
    if (!("tracking" in this.data)) {
      // @ts-ignore
      this.data["tracking"] = false
    }
    if (!("trackingMap" in this.data)) {
      // @ts-ignore
      this.data["trackingMap"] = {}
    }
    this.segments = JSON.parse(JSON.stringify(this.data.content))
  }
  @Output() change: EventEmitter<Annotation> = new EventEmitter<Annotation>();

  get annotation() {
    return this._annotation!;
  }
  editMode = false;
  constructor(private web: WebService, private toast: ToastService) {
  }

  save() {
    this.data.content = JSON.parse(JSON.stringify(this.segments))
    this.annotation.annotation = JSON.stringify(this.data)
    this.web.updateAnnotation(this.annotation.annotation, "table", this.annotation.id).subscribe((data) => {
      this._annotation = data
      this.change.emit(data)
      this.toast.show("Table", "Table updated successfully")
    })
  }

  clicked(row: number, col: number) {
    if (!this.data.tracking) {
      return
    }
    if (this.data.trackingMap[row + "," + col]) {
      delete this.data.trackingMap[row + "," + col]
    } else {
      this.data.trackingMap[row + "," + col] = true
    }
    this.save()
  }

}
