import { TestBed } from '@angular/core/testing';

import { Perfiles } from './perfiles';

describe('Perfiles', () => {
  let service: Perfiles;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Perfiles);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
