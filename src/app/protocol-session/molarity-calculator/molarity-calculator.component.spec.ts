import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MolarityCalculatorComponent } from './molarity-calculator.component';

describe('MolarityCalculatorComponent', () => {
  let component: MolarityCalculatorComponent;
  let fixture: ComponentFixture<MolarityCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MolarityCalculatorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MolarityCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
