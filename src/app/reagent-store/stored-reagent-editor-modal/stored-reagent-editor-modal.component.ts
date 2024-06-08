import {AfterViewInit, Component, Input} from '@angular/core';
import {StoredReagent} from "../../storage-object";
import {FormBuilder, FormControl, ReactiveFormsModule} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import JsBarcode from "jsbarcode";

@Component({
  selector: 'app-stored-reagent-editor-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './stored-reagent-editor-modal.component.html',
  styleUrl: './stored-reagent-editor-modal.component.scss'
})
export class StoredReagentEditorModalComponent implements AfterViewInit{
  private _storedReagent: StoredReagent|undefined = undefined

  @Input() set storedReagent(value: StoredReagent|undefined) {
    this._storedReagent = value
    if (value) {
      this.form.controls.quantity.setValue(value.quantity)
      this.form.controls.notes.setValue(value.notes)
      this.form.controls.barcode.setValue(value.barcode)
    }
  }

  get storedReagent(): StoredReagent|undefined {
    return this._storedReagent
  }

  form = this.fb.group({
    quantity: new FormControl(0),
    notes: new FormControl(''),
    barcode: new FormControl('')
  })

  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder) {
    this.form.controls.barcode.valueChanges.subscribe((data) => {
      if (data) {
        this.drawBarcode()
      }
    })
  }

  ngAfterViewInit() {
    this.drawBarcode()

  }

  close() {
    this.activeModal.dismiss()
  }

  submit() {
    if (this.form.valid) {
      this.activeModal.close(this.form.value)
    }
  }

  drawBarcode() {
    const canvas = document.getElementById('barcode-canvas') as HTMLCanvasElement
    if (this.form.controls.barcode.value) {
      JsBarcode(canvas, this.form.controls.barcode.value)
    }
  }
}
