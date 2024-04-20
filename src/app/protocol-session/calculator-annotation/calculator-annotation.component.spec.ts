import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculatorAnnotationComponent } from './calculator-annotation.component';

describe('CalculatorAnnotationComponent', () => {
  let component: CalculatorAnnotationComponent;
  let fixture: ComponentFixture<CalculatorAnnotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculatorAnnotationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CalculatorAnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
