import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentBookingModalComponent } from './instrument-booking-modal.component';

describe('InstrumentBookingModalComponent', () => {
  let component: InstrumentBookingModalComponent;
  let fixture: ComponentFixture<InstrumentBookingModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentBookingModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InstrumentBookingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
