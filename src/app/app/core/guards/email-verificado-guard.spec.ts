import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { emailVerificadoGuard } from './email-verificado-guard';

describe('emailVerificadoGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => emailVerificadoGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
