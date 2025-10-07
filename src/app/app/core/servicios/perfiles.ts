import { Injectable } from '@angular/core';
import { Perfil } from '../modelos/perfil';
import { supabase } from '../supabase/supabase.client';


@Injectable({ providedIn: 'root' })
export class Perfiles {
  private table = 'perfiles'; // la creamos en Supabase

  async getMyProfile(): Promise<Perfil | null> {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return null;

    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as Perfil;
  }

  // + métodos CRUD que iremos usando en el Sprint 1
}
