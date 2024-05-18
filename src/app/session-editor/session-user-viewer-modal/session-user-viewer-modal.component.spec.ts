import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionUserViewerModalComponent } from './session-user-viewer-modal.component';

describe('SessionUserViewerModalComponent', () => {
  let component: SessionUserViewerModalComponent;
  let fixture: ComponentFixture<SessionUserViewerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionUserViewerModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SessionUserViewerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
