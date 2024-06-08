import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionLogsModalComponent } from './action-logs-modal.component';

describe('ActionLogsModalComponent', () => {
  let component: ActionLogsModalComponent;
  let fixture: ComponentFixture<ActionLogsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionLogsModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActionLogsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
