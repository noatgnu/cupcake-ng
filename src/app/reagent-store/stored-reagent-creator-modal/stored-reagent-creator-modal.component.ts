import {Component, Input} from '@angular/core';
import {debounceTime, map, Observable, switchMap} from "rxjs";
import {WebService} from "../../web.service";
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgbActiveModal, NgbHighlight, NgbTypeahead} from "@ng-bootstrap/ng-bootstrap";
import {StorageObject, StoredReagent} from "../../storage-object";
import {Reagent} from "../../reagent";

@Component({
  selector: 'app-stored-reagent-creator-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgbTypeahead,
    NgbHighlight
  ],
  templateUrl: './stored-reagent-creator-modal.component.html',
  styleUrl: './stored-reagent-creator-modal.component.scss'
})
export class StoredReagentCreatorModalComponent {
  private _stored_at: StorageObject|undefined = undefined

  @Input() set stored_at(value: StorageObject|undefined) {
    this._stored_at = value
    if (value) {
      this.reagentSearchForm.controls.stored_object.setValue(value.id)
    }
  }

  get stored_at(): StorageObject|undefined {
    return this._stored_at
  }
  private _storedReagent?: StoredReagent|undefined = undefined
  @Input() set storedReagent(value: StoredReagent|undefined) {
    this._storedReagent = value
    console.log(value)
    if (value) {
      this.reagentSearchForm.patchValue({
        quantity: value.quantity,
        unit: value.reagent.unit,
        barcode: value.barcode,
      })
      // @ts-ignore
      this.reagentSearchForm.controls.name.setValue(value.reagent.name)
      console.log(this.reagentSearchForm)
    }
  }

  get storedReagent(): StoredReagent|undefined {
    return this._storedReagent
  }

  search = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      switchMap(term => this.web.searchReagents(term)),
      map(data =>
        data.results
      )
    )
  }

  reagentSearchForm = this.fb.group({
    name: ['', Validators.required],
    quantity: [0, Validators.required],
    notes: [''],
    unit: ['', Validators.required],
    stored_object: new FormControl<number|null>(null, Validators.required),
    barcode: [''],
    shareable: [false]
  })

  constructor(private web: WebService, private activeModal: NgbActiveModal, private fb: FormBuilder) {
  }

  onSearchIngredients(event: any) {
    event.preventDefault()
    console.log(event)
    this.reagentSearchForm.patchValue(
      {
        name: event.item.name,
        unit: event.item.unit
      }
    )
  }

  formatIngredient = (reagent: Reagent) => {
    if (typeof reagent === 'string') {
      return `${reagent}`;
    }
    return `${reagent.name}`;
  }

  resultFormatter = (reagent: Reagent) => {
    if (typeof reagent === 'string') {
      return `${reagent}`;
    }
    return reagent.name
  }

  close() {
    this.activeModal.dismiss()
  }

  submit() {
    console.log(this.reagentSearchForm.value)
    if (this.reagentSearchForm.valid) {
      this.activeModal.close(this.reagentSearchForm.value)
    }
  }

}
