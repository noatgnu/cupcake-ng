import {Component, Input} from '@angular/core';
import {Ingredient, ProtocolStepIngredient} from "../../ingredient";
import {WebService} from "../../web.service";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {debounceTime, map, Observable, switchMap} from "rxjs";
import {NgbActiveModal, NgbHighlight, NgbTypeahead} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-ingredient-editor',
  standalone: true,
  imports: [
    NgbTypeahead,
    ReactiveFormsModule,
    NgbHighlight
  ],
  templateUrl: './ingredient-editor.component.html',
  styleUrl: './ingredient-editor.component.scss'
})
export class IngredientEditorComponent {
  private _ingredients: ProtocolStepIngredient[] = []
  @Input() set ingredients(value: ProtocolStepIngredient[]) {
    this._ingredients = value
    this.ingredientForms = []
    for (const ingredient of this._ingredients) {
      console.log(ingredient)
      this.ingredientForms.push(this.fb.group({
        name: new FormControl({value: ingredient.ingredient.name, disabled: true}),
        quantity: [ingredient.quantity, Validators.required],
        unit: new FormControl({value: ingredient.ingredient.unit, disabled: true}),
        id: [ingredient.id]
      }))
    }
  }

  @Input() stepId: number = 0

  get ingredients(): ProtocolStepIngredient[] {
    return this._ingredients
  }

  ingredientForms: FormGroup[] = []

  search = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      switchMap(term => this.web.searchIngredients(term)),
      map(data => data.results)
    )
  }

  ingredientSearchForm = this.fb.group({
    name: ['', Validators.required],
    quantity: [0, Validators.required],
    unit: ['', Validators.required]
  })

  constructor(private fb: FormBuilder, private web: WebService, private activeModal: NgbActiveModal) {

  }

  addIngredient() {
    if (this.ingredientSearchForm.valid) {
      // @ts-ignore
      this.web.stepAddIngredient(this.stepId, this.ingredientSearchForm.value.name, this.ingredientSearchForm.value.quantity, this.ingredientSearchForm.value.unit).subscribe(data => {
        this._ingredients.push(data)
        this.ingredientForms.push(this.fb.group({
          name: new FormControl({value: data.ingredient.name, disabled: true}),
          quantity: [data.quantity, Validators.required],
          unit: new FormControl({value: data.ingredient.unit, disabled: true})
        }))
        this.ingredientSearchForm.reset()
      })
    }
  }

  removeIngredient(stepIngredientID: number) {
    this.web.removeIngredient(stepIngredientID).subscribe(() => {
      this._ingredients = this._ingredients.filter(value => value.ingredient.id !== stepIngredientID)
      this.ingredientForms = this.ingredientForms.filter(value => value.value.id !== stepIngredientID)
    })
  }

  formatIngredient = (ingredient: Ingredient) => {
    return `${ingredient.name}`;
  }

  onSearchIngredients(event: any) {
    this.ingredientSearchForm.controls.unit.setValue(event.item.unit)
  }

  async save() {
    for (const form of this.ingredientForms) {
      if (form.valid && form.dirty) {
        const data = await this.web.stepUpdateIngredient(this.stepId, form.value.id, form.value.quantity).toPromise()
        if (data) {
          this._ingredients = this._ingredients.map(value => {
            if (value.id === data.id) {
              value.quantity = data.quantity
            }
            return value
          })
        }
      }
    }
    this.activeModal.close(
      this._ingredients
    )
  }

  close() {
    this.activeModal.dismiss()
  }
}
