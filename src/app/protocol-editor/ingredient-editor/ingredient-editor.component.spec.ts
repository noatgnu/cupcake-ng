import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientEditorComponent } from './ingredient-editor.component';

describe('IngredientEditorComponent', () => {
  let component: IngredientEditorComponent;
  let fixture: ComponentFixture<IngredientEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IngredientEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IngredientEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
