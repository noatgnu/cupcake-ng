import { TestBed } from '@angular/core/testing';

import { InstrumentSupportInformationService } from './instrument-support-information.service';

describe('InstrumentSupportInformationService', () => {
  let service: InstrumentSupportInformationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InstrumentSupportInformationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
