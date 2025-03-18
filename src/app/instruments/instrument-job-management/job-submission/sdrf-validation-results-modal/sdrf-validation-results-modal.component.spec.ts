import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SdrfValidationResultsModalComponent } from './sdrf-validation-results-modal.component';

describe('SdrfValidationResultsModalComponent', () => {
  let component: SdrfValidationResultsModalComponent;
  let fixture: ComponentFixture<SdrfValidationResultsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdrfValidationResultsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SdrfValidationResultsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
