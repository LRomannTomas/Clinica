import { TestBed } from '@angular/core/testing';

import { Especialidades } from './especialidades';

describe('Especialidades', () => {
  let service: Especialidades;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Especialidades);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
