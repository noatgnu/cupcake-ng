import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepDescriptionPreviewModalComponent } from './step-description-preview-modal.component';

describe('StepDescriptionPreviewModalComponent', () => {
  let component: StepDescriptionPreviewModalComponent;
  let fixture: ComponentFixture<StepDescriptionPreviewModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepDescriptionPreviewModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StepDescriptionPreviewModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
