import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentJobManagementComponent } from './instrument-job-management.component';

describe('InstrumentJobManagementComponent', () => {
  let component: InstrumentJobManagementComponent;
  let fixture: ComponentFixture<InstrumentJobManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentJobManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentJobManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
