import {Component, Input} from '@angular/core';
import {ReagentActionQuery, StoredReagent} from "../../storage-object";
import {FormBuilder} from "@angular/forms";
import {NgbActiveModal, NgbPagination} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../web.service";
import {DatePipe} from "@angular/common";

@Component({
  selector: 'app-action-logs-modal',
  standalone: true,
  imports: [
    NgbPagination,
    DatePipe
  ],
  templateUrl: './action-logs-modal.component.html',
  styleUrl: './action-logs-modal.component.scss'
})
export class ActionLogsModalComponent {
  private _storedReagent: StoredReagent|undefined = undefined
  @Input() set storedReagent(value: StoredReagent|undefined) {
    this._storedReagent = value
    if (value) {
      this.web.getStoredReagentActions(value.id, this.pageSize, this.currentPageOffset).subscribe((data) => {
        this.actionLogs = data
      })
    }
  }

  get storedReagent(): StoredReagent|undefined {
    return this._storedReagent!
  }

  actionLogs?: ReagentActionQuery = undefined

  pageSize = 10
  currentPageOffset = 0
  currentPage = 1

  constructor(private activeModal: NgbActiveModal, private web: WebService) {
  }

  close() {
    this.activeModal.dismiss()
  }

  handlePageChange(event: number) {
    this.currentPageOffset = (event - 1) * this.pageSize
    // @ts-ignore
    this.web.getStoredReagentActions(this.storedReagent.id, this.pageSize, this.currentPageOffset).subscribe((data) => {
      this.actionLogs = data
    })
  }


}
