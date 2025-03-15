import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportBookingsComponent } from './export-bookings.component';

describe('ExportBookingsComponent', () => {
  let component: ExportBookingsComponent;
  let fixture: ComponentFixture<ExportBookingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportBookingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportBookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
