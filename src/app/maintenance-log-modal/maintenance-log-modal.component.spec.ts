import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceLogModalComponent } from './maintenance-log-modal.component';

describe('MaintenanceLogModalComponent', () => {
  let component: MaintenanceLogModalComponent;
  let fixture: ComponentFixture<MaintenanceLogModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceLogModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintenanceLogModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
