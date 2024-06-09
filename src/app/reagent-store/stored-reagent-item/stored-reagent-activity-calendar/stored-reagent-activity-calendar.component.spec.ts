import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoredReagentActivityCalendarComponent } from './stored-reagent-activity-calendar.component';

describe('StoredReagentActivityCalendarComponent', () => {
  let component: StoredReagentActivityCalendarComponent;
  let fixture: ComponentFixture<StoredReagentActivityCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoredReagentActivityCalendarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StoredReagentActivityCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
