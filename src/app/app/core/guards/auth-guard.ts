import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { supabase } from '../supabase/supabase.client';


export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    router.navigateByUrl('/login');
    return false;
  }
  return true;
};
