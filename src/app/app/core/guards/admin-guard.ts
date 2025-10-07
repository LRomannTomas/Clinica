import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Perfiles } from '../servicios/perfiles';
import { ToastService } from '../servicios/toast';

export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const perfiles = inject(Perfiles);
  const toast = inject(ToastService);

  try {
    const me = await perfiles.getMyProfile();

    if (!me || me.perfil !== 'admin') {
      toast.show('Acceso denegado: esta sección es solo para administradores.', 'error');
      router.navigateByUrl('/home');
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error en adminGuard:', err);
    toast.show('Error verificando permisos. Inicie sesión nuevamente.', 'error');
    router.navigateByUrl('/login');
    return false;
  }
};
