import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlignmentAnnotationComponent } from './alignment-annotation.component';

describe('AlignmentAnnotationComponent', () => {
  let component: AlignmentAnnotationComponent;
  let fixture: ComponentFixture<AlignmentAnnotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlignmentAnnotationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AlignmentAnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
