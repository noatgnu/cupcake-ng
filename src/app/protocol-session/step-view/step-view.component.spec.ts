import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepViewComponent } from './step-view.component';

describe('StepViewComponent', () => {
  let component: StepViewComponent;
  let fixture: ComponentFixture<StepViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StepViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
