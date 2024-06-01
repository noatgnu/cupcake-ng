import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentManagementComponent } from './instrument-management.component';

describe('InstrumentManagementComponent', () => {
  let component: InstrumentManagementComponent;
  let fixture: ComponentFixture<InstrumentManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InstrumentManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
