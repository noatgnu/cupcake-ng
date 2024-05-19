import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepDescriptionEditorComponent } from './step-description-editor.component';

describe('StepDescriptionEditorComponent', () => {
  let component: StepDescriptionEditorComponent;
  let fixture: ComponentFixture<StepDescriptionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepDescriptionEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StepDescriptionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
