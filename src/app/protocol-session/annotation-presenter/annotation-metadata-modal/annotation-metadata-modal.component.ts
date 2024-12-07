import {Component, Input} from '@angular/core';
import {Annotation} from "../../../annotation";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder} from "@angular/forms";
import {filter, map, Observable, of, startWith, switchMap} from "rxjs";
import {WebService} from "../../../web.service";
import {Unimod} from "../../../unimod";
import {ItemMetadataComponent} from "../../../item-metadata/item-metadata.component";

@Component({
  selector: 'app-annotation-metadata-modal',
  standalone: true,
  imports: [
    ItemMetadataComponent
  ],
  templateUrl: './annotation-metadata-modal.component.html',
  styleUrl: './annotation-metadata-modal.component.scss'
})
export class AnnotationMetadataModalComponent {

  private _annotation!: Annotation
  @Input() set annotation(value: Annotation) {
    this._annotation = value
  }

  get annotation(): Annotation {
    return this._annotation
  }



  constructor(private activeModal: NgbActiveModal) {

  }

  close() {
    this.activeModal.dismiss()
  }

}
