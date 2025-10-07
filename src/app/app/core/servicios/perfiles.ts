import { Injectable } from '@angular/core';
import { Perfil } from '../modelos/perfil';
import { supabase } from '../supabase/supabase.client';


@Injectable({ providedIn: 'root' })
export class Perfiles {
  private table = 'usuarios'; 

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


}
