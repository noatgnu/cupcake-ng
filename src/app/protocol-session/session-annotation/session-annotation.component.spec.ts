import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionAnnotationComponent } from './session-annotation.component';

describe('SessionAnnotationComponent', () => {
  let component: SessionAnnotationComponent;
  let fixture: ComponentFixture<SessionAnnotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionAnnotationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SessionAnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
