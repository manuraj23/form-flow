import { TestBed } from '@angular/core/testing';

import { ConditionalLogicService } from './conditional-logic-service';

describe('ConditionalLogicService', () => {
  let service: ConditionalLogicService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConditionalLogicService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
