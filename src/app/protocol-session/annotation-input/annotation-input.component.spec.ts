import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationInputComponent } from './annotation-input.component';

describe('AnnotationInputComponent', () => {
  let component: AnnotationInputComponent;
  let fixture: ComponentFixture<AnnotationInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnotationInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnotationInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
