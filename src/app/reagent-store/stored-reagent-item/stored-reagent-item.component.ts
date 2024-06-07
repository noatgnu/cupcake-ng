import {Component, EventEmitter, Input, Output} from '@angular/core';
import {StoredReagent} from "../../storage-object";
import {WebService} from "../../web.service";
import {AccountsService} from "../../accounts/accounts.service";

@Component({
  selector: 'app-stored-reagent-item',
  standalone: true,
  imports: [],
  templateUrl: './stored-reagent-item.component.html',
  styleUrl: './stored-reagent-item.component.scss'
})
export class StoredReagentItemComponent {
  private _storedReagent: StoredReagent|undefined = undefined
  @Input() set storedReagent(value: StoredReagent|undefined) {
    this._storedReagent = value
    if (value) {
      this.web.getStorageObjectPathToRoot(value.storage_object.id).subscribe((data) => {
        this.pathToRoot = data
      })
    }
  }

  get storedReagent(): StoredReagent|undefined {
    return this._storedReagent!
  }

  @Output() delete: EventEmitter<boolean> = new EventEmitter<boolean>()
  @Output() openStoredReagentEditorModal: EventEmitter<boolean> = new EventEmitter<boolean>()

  pathToRoot: {id: number, name: string}[] = []

  constructor(private web: WebService, public accounts: AccountsService) {

  }


}
