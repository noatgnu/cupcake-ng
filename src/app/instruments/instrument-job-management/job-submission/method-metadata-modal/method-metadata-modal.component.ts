import {Component, Input} from '@angular/core';
import {MetadataColumn} from "../../../../metadata-column";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-method-metadata-modal',
  imports: [],
  templateUrl: './method-metadata-modal.component.html',
  styleUrl: './method-metadata-modal.component.scss'
})
export class MethodMetadataModalComponent {
  @Input() action: "copy"| "import" = "import"
  @Input() metadata_columns: MetadataColumn[] = []

  selected_columns: MetadataColumn[] = []

  constructor(private activeModal: NgbActiveModal) {
  }

  close() {
    this.activeModal.dismiss()
  }

  save() {
    this.activeModal.close(this.selected_columns)
  }

  saveAll() {
    this.activeModal.close(this.metadata_columns)
  }

  handleSelectedColumn(column: MetadataColumn) {
    if (this.selected_columns.includes(column)) {
      this.selected_columns = this.selected_columns.filter(c => c !== column)
    } else {
      this.selected_columns.push(column)
    }
  }
}
