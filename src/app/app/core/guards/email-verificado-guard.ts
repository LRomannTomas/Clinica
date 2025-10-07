import { CanActivateFn } from '@angular/router';

export const emailVerificadoGuard: CanActivateFn = (route, state) => {
  return true;
};
