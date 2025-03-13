import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobTemplateCreationModalComponent } from './job-template-creation-modal.component';

describe('JobTemplateCreationModalComponent', () => {
  let component: JobTemplateCreationModalComponent;
  let fixture: ComponentFixture<JobTemplateCreationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobTemplateCreationModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobTemplateCreationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
