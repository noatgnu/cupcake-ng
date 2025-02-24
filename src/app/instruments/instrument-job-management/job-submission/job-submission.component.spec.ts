import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobSubmissionComponent } from './job-submission.component';

describe('JobSubmissionComponent', () => {
  let component: JobSubmissionComponent;
  let fixture: ComponentFixture<JobSubmissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobSubmissionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobSubmissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
