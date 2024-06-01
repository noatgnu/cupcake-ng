import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentManagementModalComponent } from './instrument-management-modal.component';

describe('InstrumentManagementModalComponent', () => {
  let component: InstrumentManagementModalComponent;
  let fixture: ComponentFixture<InstrumentManagementModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentManagementModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InstrumentManagementModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
