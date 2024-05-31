import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentBookingComponent } from './instrument-booking.component';

describe('InstrumentBookingComponent', () => {
  let component: InstrumentBookingComponent;
  let fixture: ComponentFixture<InstrumentBookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentBookingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InstrumentBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
