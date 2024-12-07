import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentMetadataManagementModalComponent } from './instrument-metadata-management-modal.component';

describe('InstrumentMetadataManagementModalComponent', () => {
  let component: InstrumentMetadataManagementModalComponent;
  let fixture: ComponentFixture<InstrumentMetadataManagementModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentMetadataManagementModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentMetadataManagementModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
