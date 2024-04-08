import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionEditorModalComponent } from './session-editor-modal.component';

describe('SessionEditorModalComponent', () => {
  let component: SessionEditorModalComponent;
  let fixture: ComponentFixture<SessionEditorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionEditorModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SessionEditorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
