import {Component, Input} from '@angular/core';
import {debounceTime, map, Observable, switchMap} from "rxjs";
import {WebService} from "../../web.service";
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgbActiveModal, NgbHighlight, NgbTypeahead} from "@ng-bootstrap/ng-bootstrap";
import {StorageObject} from "../../storage-object";
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
  })

  constructor(private web: WebService, private activeModal: NgbActiveModal, private fb: FormBuilder) {
  }

  onSearchIngredients(event: any) {
    event.preventDefault()
    this.reagentSearchForm.patchValue(
      {
        name: event.item.name,
        unit: event.item.unit
      }
    )
    console.log(this.reagentSearchForm.value)
  }

  formatIngredient = (reagent: Reagent) => {
    return `${reagent.name}`;
  }

  resultFormatter = (reagent: Reagent) => reagent.name

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
