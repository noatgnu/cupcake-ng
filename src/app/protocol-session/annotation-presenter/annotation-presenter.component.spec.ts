import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationPresenterComponent } from './annotation-presenter.component';

describe('AnnotationPresenterComponent', () => {
  let component: AnnotationPresenterComponent;
  let fixture: ComponentFixture<AnnotationPresenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnotationPresenterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnnotationPresenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
