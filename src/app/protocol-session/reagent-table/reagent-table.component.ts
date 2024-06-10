import {Component, Input} from '@angular/core';
import {ProtocolStepReagent} from "../../reagent";
import {ProtocolStep} from "../../protocol";
import {WebService} from "../../web.service";
import {ReagentAction, StoredReagent} from "../../storage-object";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ReagentStockSearchModalComponent} from "../reagent-stock-search-modal/reagent-stock-search-modal.component";
import {DatePipe} from "@angular/common";

@Component({
  selector: 'app-reagent-table',
  standalone: true,
  imports: [
    DatePipe
  ],
  templateUrl: './reagent-table.component.html',
  styleUrl: './reagent-table.component.scss'
})
export class ReagentTableComponent {
  selectedReagent: ProtocolStepReagent|undefined = undefined
  selectedStoredReagent: StoredReagent|undefined = undefined
  selectedStoredReagentPath: {id: number, name: string}[] = []
  private _step: ProtocolStep|undefined = undefined
  @Input() set step(value: ProtocolStep) {
    this._step = value
    this.getReagentAction(value.id)
  }

  get step(): ProtocolStep {
    return this._step!
  }

  reagentActions: ReagentAction[] = []
  reagentActionMap: {[key: string]: ReagentAction} = {}

  constructor(public web: WebService, private modal: NgbModal) {
  }

  getReagentAction(step_id: number) {
    this.web.getStepAssociatedReagentActions(step_id).subscribe((data) => {
      this.reagentActions = data
      for (let action of data) {
        if (action.step_reagent) {
          this.reagentActionMap[action.step_reagent] = action
        }
      }
    })
  }

  openReserveReagentActionModal(reagent: ProtocolStepReagent) {
    const ref = this.modal.open(ReagentStockSearchModalComponent, {scrollable: true})
    ref.componentInstance.reagent = reagent
    ref.closed.subscribe((data: { reagent:StoredReagent, quantity: number }) => {
      if (data) {
        this.web.createStoredReagentAction(data.reagent.id, 'reserve', data.quantity, "", reagent.id).subscribe(
          (dataReagent: ReagentAction) => {
            this.getReagentAction(this.step.id)
          }
        )
      }
    })
  }

  selectReagent(reagent: ProtocolStepReagent) {
    if (this.selectedReagent) {
      this.selectedReagent = undefined
      this.selectedStoredReagent = undefined
      this.selectedStoredReagentPath = []
    } else {
      this.selectedReagent = reagent
      this.web.getStoredReagent(this.reagentActionMap[reagent.id].reagent).subscribe((data) => {
        this.selectedStoredReagent = data
        this.web.getStorageObjectPathToRoot(data.storage_object.id).subscribe((path) => {
          this.selectedStoredReagentPath = path
        })
      })
    }
  }

  checkIfCreatedAtIsLessThanMinute(reagentAction: ReagentAction, minute: number = 5) {
    let date = new Date(reagentAction.created_at)
    let now = new Date()
    return now.getTime() - date.getTime() < minute * 60 * 1000
  }

  deleteAction(reagentAction: ReagentAction) {
    this.web.deleteReagentAction(reagentAction.id).subscribe(() => {
      delete this.reagentActionMap[reagentAction.step_reagent]
      this.selectedStoredReagent = undefined
      this.selectedReagent = undefined
      this.selectedStoredReagentPath = []
    })
  }
}
