import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffDataEntryPanelComponent } from './staff-data-entry-panel.component';

describe('StaffDataEntryPanelComponent', () => {
  let component: StaffDataEntryPanelComponent;
  let fixture: ComponentFixture<StaffDataEntryPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffDataEntryPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffDataEntryPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
