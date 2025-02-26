import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobMetadataCreationModalComponent } from './job-metadata-creation-modal.component';

describe('JobMetadataCreationModalComponent', () => {
  let component: JobMetadataCreationModalComponent;
  let fixture: ComponentFixture<JobMetadataCreationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobMetadataCreationModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobMetadataCreationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
