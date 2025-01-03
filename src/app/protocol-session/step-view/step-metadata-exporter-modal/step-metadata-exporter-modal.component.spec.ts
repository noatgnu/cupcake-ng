import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepMetadataExporterModalComponent } from './step-metadata-exporter-modal.component';

describe('StepMetadataExporterModalComponent', () => {
  let component: StepMetadataExporterModalComponent;
  let fixture: ComponentFixture<StepMetadataExporterModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepMetadataExporterModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepMetadataExporterModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
