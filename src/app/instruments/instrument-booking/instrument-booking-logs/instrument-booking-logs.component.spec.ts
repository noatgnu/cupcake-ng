import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentBookingLogsComponent } from './instrument-booking-logs.component';

describe('InstrumentBookingLogsComponent', () => {
  let component: InstrumentBookingLogsComponent;
  let fixture: ComponentFixture<InstrumentBookingLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentBookingLogsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentBookingLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
