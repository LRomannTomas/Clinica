import { Injectable } from '@angular/core';
import { supabase } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class Almacenamiento {

  async subirImagen(
    archivo: File,
    rol: 'paciente' | 'especialista',
    userId: string,
    nombreArchivo: string
  ): Promise<string | null> {
    const bucket = rol === 'paciente' ? 'pacientes' : 'especialistas';
    const ruta = `${userId}/${nombreArchivo}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(ruta, archivo, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error(`Error al subir la imagen (${rol}):`, error.message);
      return null;
    }

    return this.getUrlPublica(bucket, ruta);
  }

  getUrlPublica(bucket: string, ruta: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(ruta);
    return data.publicUrl;
  }

  async eliminarImagen(bucket: string, ruta: string) {
    const { error } = await supabase.storage.from(bucket).remove([ruta]);
    if (error) console.error('Error al eliminar imagen:', error.message);
  }
}
