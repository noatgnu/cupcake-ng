import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionUserEditorModalComponent } from './session-user-editor-modal.component';

describe('SessionUserEditorModalComponent', () => {
  let component: SessionUserEditorModalComponent;
  let fixture: ComponentFixture<SessionUserEditorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionUserEditorModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SessionUserEditorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
