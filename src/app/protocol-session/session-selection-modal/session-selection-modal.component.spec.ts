import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionSelectionModalComponent } from './session-selection-modal.component';

describe('SessionSelectionModalComponent', () => {
  let component: SessionSelectionModalComponent;
  let fixture: ComponentFixture<SessionSelectionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionSelectionModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SessionSelectionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
