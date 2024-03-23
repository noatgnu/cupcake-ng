import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandwrittenAnnotationComponent } from './handwritten-annotation.component';

describe('HandwrittenAnnotationComponent', () => {
  let component: HandwrittenAnnotationComponent;
  let fixture: ComponentFixture<HandwrittenAnnotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandwrittenAnnotationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HandwrittenAnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
