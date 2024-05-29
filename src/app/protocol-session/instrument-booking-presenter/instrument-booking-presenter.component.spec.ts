import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentBookingPresenterComponent } from './instrument-booking-presenter.component';

describe('InstrumentBookingPresenterComponent', () => {
  let component: InstrumentBookingPresenterComponent;
  let fixture: ComponentFixture<InstrumentBookingPresenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentBookingPresenterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InstrumentBookingPresenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
