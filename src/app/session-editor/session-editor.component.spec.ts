import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionEditorComponent } from './session-editor.component';

describe('SessionEditorComponent', () => {
  let component: SessionEditorComponent;
  let fixture: ComponentFixture<SessionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SessionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
