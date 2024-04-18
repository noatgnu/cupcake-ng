import { TestBed } from '@angular/core/testing';

import { SequenceAlignmentService } from './sequence-alignment.service';

describe('SequenceAlignmentService', () => {
  let service: SequenceAlignmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SequenceAlignmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
