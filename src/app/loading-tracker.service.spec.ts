import { TestBed } from '@angular/core/testing';

import { LoadingTrackerService } from './loading-tracker.service';

describe('LoadingTrackerService', () => {
  let service: LoadingTrackerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingTrackerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
