import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationTextFormComponent } from './annotation-text-form.component';

describe('AnnotationTextFormComponent', () => {
  let component: AnnotationTextFormComponent;
  let fixture: ComponentFixture<AnnotationTextFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnotationTextFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnnotationTextFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
