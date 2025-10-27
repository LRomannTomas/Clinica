import { Injectable } from '@angular/core';
import { supabase } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class Auth {

  async signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { data: null, error }; // 👈 mantener estructura esperada

  // ✅ Registrar el ingreso si el login fue exitoso
  const user = data.user;
  if (user) {
    const { error: logError } = await supabase.from('log_ingresos').insert({
      usuario_id: user.id,
      email: user.email,
      fecha: new Date().toISOString(),
    });
    if (logError) console.error('Error al registrar log de ingreso:', logError.message);
  }

  return { data, error: null }; // 👈 se devuelve con el mismo formato que antes
}


  signUp(email: string, password: string, metadata: any = {}) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
  }

  signOut() {
    return supabase.auth.signOut();
  }

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error al obtener sesión:', error.message);
      return null;
    }
    return data.session ?? null;
  }

  onAuth(cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(cb);
  }

  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error al obtener usuario:', error.message);
      return null;
    }
    return data.user ?? null;
  }

  async updateUserMetadata(metadata: any) {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });
    if (error) {
      console.error('Error al actualizar metadata:', error.message);
      throw error;
    }
    return data.user;
  }
}
