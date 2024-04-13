import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CupcakeRatingComponent } from './cupcake-rating.component';

describe('CupcakeRatingComponent', () => {
  let component: CupcakeRatingComponent;
  let fixture: ComponentFixture<CupcakeRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CupcakeRatingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CupcakeRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
