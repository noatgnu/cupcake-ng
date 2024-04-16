import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarSessionModalComponent } from './calendar-session-modal.component';

describe('CalendarSessionModalComponent', () => {
  let component: CalendarSessionModalComponent;
  let fixture: ComponentFixture<CalendarSessionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarSessionModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CalendarSessionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
