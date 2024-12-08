import {Component, Input} from '@angular/core';
import {ProtocolStepReagent} from "../../reagent";
import {ProtocolStep} from "../../protocol";
import {WebService} from "../../web.service";
import {ReagentAction, StoredReagent} from "../../storage-object";
import {NgbModal, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {ReagentStockSearchModalComponent} from "../reagent-stock-search-modal/reagent-stock-search-modal.component";
import {DatePipe} from "@angular/common";
import {DataService} from "../../data.service";
import {forkJoin} from "rxjs";

@Component({
  selector: 'app-reagent-table',
  standalone: true,
  imports: [
    DatePipe,
    NgbTooltip
  ],
  templateUrl: './reagent-table.component.html',
  styleUrl: './reagent-table.component.scss'
})
export class ReagentTableComponent {
  selectedReagent: ProtocolStepReagent|undefined = undefined
  selectedStoredReagent: StoredReagent[] = []
  selectedStoredReagentPath: {[key: number]: {id: number, name: string}[]} = {}
  private _step: ProtocolStep|undefined = undefined
  @Input() set step(value: ProtocolStep) {
    this._step = value
    this.getReagentAction(value.id)
  }

  get step(): ProtocolStep {
    return this._step!
  }

  reagentActions: ReagentAction[] = []
  reagentActionMap: {[key: string]: {[storedReagentKey: string]: ReagentAction[]}} = {}

  constructor(public web: WebService, private modal: NgbModal, private data: DataService) {
  }

  getReagentAction(step_id: number) {
    this.web.getStepAssociatedReagentActions(step_id, this.data.currentSession.unique_id).subscribe((data) => {
      this.reagentActions = data
      for (let action of data) {
        if (action.step_reagent) {
          if (!this.reagentActionMap[action.step_reagent]) {
            this.reagentActionMap[action.step_reagent] = {}
          }
          if (!this.reagentActionMap[action.step_reagent][action.reagent]) {
            this.reagentActionMap[action.step_reagent][action.reagent] = []
          }
          if (!this.reagentActionMap[action.step_reagent][action.reagent].find((r) => r.id === action.id)) {
            this.reagentActionMap[action.step_reagent][action.reagent].push(action)
          }
        }
      }
    })
  }

  openReserveReagentActionModal(reagent: ProtocolStepReagent) {
    const ref = this.modal.open(ReagentStockSearchModalComponent, {scrollable: true})
    ref.componentInstance.reagent = reagent
    ref.closed.subscribe((data: { reagent:StoredReagent, quantity: number }) => {
      if (data) {
        this.web.createStoredReagentAction(data.reagent.id, 'reserve', data.quantity, "", reagent.id, this.data.currentSession.unique_id).subscribe(
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
      this.selectedStoredReagent = []
      //this.selectedStoredReagentPath = []
    } else {
      this.selectedReagent = reagent
      const works = []
      for (const storedReagent in this.reagentActionMap[reagent.id]) {
        works.push(this.web.getStoredReagent(parseInt(storedReagent)))
      }
      forkJoin(works).subscribe((data) => {
        this.selectedStoredReagent = data
        for (const i of data) {
          this.web.getStorageObjectPathToRoot(i.storage_object.id).subscribe((path) => {
            this.selectedStoredReagentPath[i.storage_object.id] = path
          })
        }
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
      // check if more than one action for this reagent
      if (this.reagentActionMap[reagentAction.step_reagent][reagentAction.reagent].length > 1) {
        this.reagentActionMap[reagentAction.step_reagent][reagentAction.reagent] = this.reagentActionMap[reagentAction.step_reagent][reagentAction.reagent].filter((r) => r.id !== reagentAction.id)

      } else {
        delete this.reagentActionMap[reagentAction.step_reagent][reagentAction.reagent]
        this.selectedStoredReagent = this.selectedStoredReagent.filter((r) => r.id !== reagentAction.reagent)
        this.selectedStoredReagentPath[reagentAction.reagent] = []
      }
      this.reagentActions = this.reagentActions.filter((r) => r.id !== reagentAction.id)
    })
  }
}
