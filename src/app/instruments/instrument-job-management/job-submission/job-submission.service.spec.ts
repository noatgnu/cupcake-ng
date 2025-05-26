import { TestBed } from '@angular/core/testing';

import { JobSubmissionService } from './job-submission.service';

describe('JobSubmissionService', () => {
  let service: JobSubmissionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JobSubmissionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
