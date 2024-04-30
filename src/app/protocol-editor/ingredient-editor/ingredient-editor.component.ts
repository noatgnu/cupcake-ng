import {Component, Input} from '@angular/core';
import {Ingredient, ProtocolStepIngredient} from "../../ingredient";
import {WebService} from "../../web.service";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {debounceTime, map, Observable, switchMap} from "rxjs";
import {NgbTypeahead} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-ingredient-editor',
  standalone: true,
  imports: [
    NgbTypeahead,
    ReactiveFormsModule
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
      this.ingredientForms.push(this.fb.group({
        ingredient: [ingredient.ingredient.name],
        quantity: [ingredient.quantity, Validators.required],
        unit: [ingredient.ingredient.unit]
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
    quantity: ['', Validators.required],
    unit: ['', Validators.required]
  })


  constructor(private fb: FormBuilder, private web: WebService) {

  }


  addIngredient() {
    if (this.ingredientSearchForm.valid) {

    }
  }

  formatIngredient = (ingredient: Ingredient) => {
    return `${ingredient.name} (${ingredient.unit})`;
  }

  onSearchIngredients(event: any) {
    this.ingredientSearchForm.controls.unit.setValue(event.item.unit)
  }
}
