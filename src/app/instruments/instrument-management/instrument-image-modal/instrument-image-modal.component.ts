import {Component, EventEmitter, Output} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-instrument-image-modal',
  imports: [],
  templateUrl: './instrument-image-modal.component.html',
  styleUrl: './instrument-image-modal.component.scss'
})
export class InstrumentImageModalComponent {
  @Output() imageBase64 = new EventEmitter<string>();
  imageSrc: string | ArrayBuffer | null = null;

  constructor(public activeModal: NgbActiveModal) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imageSrc = e.target?.result as string | ArrayBuffer;
      };
      reader.readAsDataURL(file);
    }
  }

  save() {
    if (this.imageSrc) {
      this.imageBase64.emit(this.imageSrc as string);
      this.activeModal.close();
    }
  }

  close() {
    this.activeModal.dismiss();
  }
}
