import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextAnnotationPresenterComponent } from './text-annotation-presenter.component';

describe('TextAnnotationPresenterComponent', () => {
  let component: TextAnnotationPresenterComponent;
  let fixture: ComponentFixture<TextAnnotationPresenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextAnnotationPresenterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TextAnnotationPresenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});