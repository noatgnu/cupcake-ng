import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReagentEditorComponent } from './reagent-editor.component';

describe('IngredientEditorComponent', () => {
  let component: ReagentEditorComponent;
  let fixture: ComponentFixture<ReagentEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReagentEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReagentEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
