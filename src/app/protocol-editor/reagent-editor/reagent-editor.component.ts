import {Component, Input} from '@angular/core';
import {Reagent, ProtocolStepReagent} from "../../reagent";
import {WebService} from "../../web.service";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {debounceTime, map, Observable, switchMap} from "rxjs";
import {NgbActiveModal, NgbHighlight, NgbTypeahead} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-reagent-editor',
  standalone: true,
  imports: [
    NgbTypeahead,
    ReactiveFormsModule,
    NgbHighlight
  ],
  templateUrl: './reagent-editor.component.html',
  styleUrl: './reagent-editor.component.scss'
})
export class ReagentEditorComponent {
  private _reagents: ProtocolStepReagent[] = []
  @Input() set reagents(value: ProtocolStepReagent[]) {
    this._reagents = value
    this.reagentForms = []
    for (const reagent of this._reagents) {
      console.log(reagent)
      this.reagentForms.push(this.fb.group({
        name: new FormControl({value: reagent.reagent.name, disabled: true}),
        quantity: [reagent.quantity, Validators.required],
        unit: new FormControl({value: reagent.reagent.unit, disabled: true}),
        id: [reagent.id],
        scalable: [reagent.scalable],
        scalable_factor: [reagent.scalable_factor]
      }))
    }
  }

  @Input() stepId: number = 0

  get reagents(): ProtocolStepReagent[] {
    return this._reagents
  }

  reagentForms: FormGroup[] = []

  search = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      switchMap(term => this.web.searchReagents(term)),
      map(data => data.results)
    )
  }

  reagentSearchForm = this.fb.group({
    name: ['', Validators.required],
    quantity: [0, Validators.required],
    unit: ['', Validators.required],
    scalable: [false, Validators.required],
    scalable_factor: [1.0, Validators.required]
  })

  constructor(private fb: FormBuilder, private web: WebService, private activeModal: NgbActiveModal) {

  }

  addIngredient() {
    if (this.reagentSearchForm.valid) {
      // @ts-ignore
      this.web.stepAddReagent(this.stepId, this.reagentSearchForm.value.name, this.reagentSearchForm.value.quantity, this.reagentSearchForm.value.unit, this.reagentSearchForm.value.scalable, this.reagentSearchForm.value.scalable_factor).subscribe(data => {
        this._reagents.push(data)
        this.reagentForms.push(this.fb.group({
          name: new FormControl({value: data.reagent.name, disabled: true}),
          quantity: [data.quantity, Validators.required],
          unit: new FormControl({value: data.reagent.unit, disabled: true}),
          scalable: [data.scalable],
          scalable_factor: [data.scalable_factor],
        }))
        this.reagentSearchForm.reset()
      })
    }
  }

  removeIngredient(stepIngredientID: number) {
    this.web.removeReagent(stepIngredientID).subscribe(() => {
      this._reagents = this._reagents.filter(value => value.reagent.id !== stepIngredientID)
      this.reagentForms = this.reagentForms.filter(value => value.value.id !== stepIngredientID)
    })
  }

  formatIngredient = (reagent: Reagent) => {
    if (typeof reagent === 'string') {
      return `${reagent}`;
    }
    return `${reagent.name}`;
  }

  onSearchIngredients(event: any) {
    event.preventDefault()
    console.log(event)
    this.reagentSearchForm.controls.unit.setValue(event.item.unit)
    this.reagentSearchForm.controls.name.setValue(event.item.name)
  }

  async save() {
    for (const form of this.reagentForms) {
      if (form.valid && form.dirty) {
        const data = await this.web.stepUpdateReagent(this.stepId, form.value.id, form.value.quantity, form.value.scalable, form.value.scalable_factor).toPromise()
        if (data) {
          this._reagents = this._reagents.map(value => {
            if (value.id === data.id) {
              value.quantity = data.quantity
              value.scalable = data.scalable
              value.scalable_factor = data.scalable_factor
            }
            return value
          })
        }
      }
    }
    this.activeModal.close(
      this._reagents
    )
  }

  close() {
    this.activeModal.dismiss()
  }
}
