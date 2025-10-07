import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Perfiles } from '../servicios/perfiles';


export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const profiles = inject(Perfiles);
  try {
    const me = await profiles.getMyProfile();
    if (me?.perfil !== 'admin') {
      router.navigateByUrl('/');
      return false;
    }
    return true;
  } catch {
    router.navigateByUrl('/');
    return false;
  }
};
