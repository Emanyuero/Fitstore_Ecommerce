import { TestBed } from '@angular/core/testing';

import { Searchfilter } from './searchfilter';

describe('Searchfilter', () => {
  let service: Searchfilter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Searchfilter);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
