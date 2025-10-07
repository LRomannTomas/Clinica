import { Injectable } from '@angular/core';
import { supabase } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class Auth {

  signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
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
