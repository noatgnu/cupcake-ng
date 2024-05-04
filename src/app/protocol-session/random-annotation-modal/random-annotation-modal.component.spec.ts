import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RandomAnnotationModalComponent } from './random-annotation-modal.component';

describe('RandomAnnotationModalComponent', () => {
  let component: RandomAnnotationModalComponent;
  let fixture: ComponentFixture<RandomAnnotationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RandomAnnotationModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RandomAnnotationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
