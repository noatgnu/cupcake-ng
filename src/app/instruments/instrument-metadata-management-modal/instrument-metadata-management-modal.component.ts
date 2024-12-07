import {Component, Input} from '@angular/core';
import {Instrument} from "../../instrument";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {ItemMetadataComponent} from "../../item-metadata/item-metadata.component";

@Component({
  selector: 'app-instrument-metadata-management-modal',
  standalone: true,
  imports: [
    ItemMetadataComponent
  ],
  templateUrl: './instrument-metadata-management-modal.component.html',
  styleUrl: './instrument-metadata-management-modal.component.scss'
})
export class InstrumentMetadataManagementModalComponent {
  @Input() instrument?: Instrument;

  constructor(private activeModal: NgbActiveModal) {
  }

  close() {
    this.activeModal.dismiss();
  }

}
