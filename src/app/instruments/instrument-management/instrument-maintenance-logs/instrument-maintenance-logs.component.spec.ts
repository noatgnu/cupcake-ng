import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentMaintenanceLogsComponent } from './instrument-maintenance-logs.component';

describe('InstrumentMaintenanceLogComponent', () => {
  let component: InstrumentMaintenanceLogsComponent;
  let fixture: ComponentFixture<InstrumentMaintenanceLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentMaintenanceLogsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentMaintenanceLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
