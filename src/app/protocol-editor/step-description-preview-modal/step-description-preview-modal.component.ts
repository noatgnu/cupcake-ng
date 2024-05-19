import {Component, Input} from '@angular/core';
import {ProtocolStep} from "../../protocol";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-step-description-preview-modal',
  standalone: true,
  imports: [],
  templateUrl: './step-description-preview-modal.component.html',
  styleUrl: './step-description-preview-modal.component.scss'
})
export class StepDescriptionPreviewModalComponent {
  private _step?: ProtocolStep
  @Input() set step(value: ProtocolStep) {
    this._step = value
    const reagents = this._step.reagents
    let description = this._step.step_description.slice()
    for (const reagent of reagents) {
      description = description.replaceAll(`%${reagent.id}.name%`, reagent.reagent.name)
      description = description.replaceAll(`%${reagent.id}.quantity%`, reagent.quantity.toString())
      description = description.replaceAll(`%${reagent.id}.unit%`, reagent.reagent.unit)
      description = description.replaceAll(`%${reagent.id}.scaled_quantity%`, (reagent.quantity * reagent.scalable_factor).toFixed(2))
    }
    this.displayDescription = description
  }
  get step(): ProtocolStep {
    return this._step!
  }

  displayDescription: string = ""

  constructor(private activeModal: NgbActiveModal) {

  }

  close() {
    this.activeModal.dismiss()
  }

}
