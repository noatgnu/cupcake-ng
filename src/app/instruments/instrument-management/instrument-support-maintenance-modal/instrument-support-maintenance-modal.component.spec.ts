import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentSupportMaintenanceModalComponent } from './instrument-support-maintenance-modal.component';

describe('InstrumentSupportMaintenanceModalComponent', () => {
  let component: InstrumentSupportMaintenanceModalComponent;
  let fixture: ComponentFixture<InstrumentSupportMaintenanceModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentSupportMaintenanceModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentSupportMaintenanceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
