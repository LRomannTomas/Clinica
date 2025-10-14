import { Injectable } from '@angular/core';
import { supabase } from '../supabase/supabase.client';
import { Auth } from './auth';

@Injectable({ providedIn: 'root' })
export class Turnos {
  constructor(private auth: Auth) {}

  async getTurnosPaciente() {
    const user = await this.auth.getUser();
    const userId = user?.id;
    if (!userId) throw new Error('Usuario no autenticado.');

    const { data, error } = await supabase
      .from('turnos')
      .select(`
        *,
        especialista:usuarios!turnos_especialista_id_fkey (nombre, apellido),
        detalles_turno(*)
      `)
      .eq('paciente_id', userId)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async getTurnosPorPacienteConDetalles(pacienteId: string) {
  const { data, error } = await supabase
    .from('turnos')
    .select(`
      *,
      usuarios_especialistas:especialista_id (nombre, apellido),
      detalles_turno (*)
    `)
    .eq('paciente_id', pacienteId)
    .order('fecha', { ascending: true });

  if (error) throw error;
  return data || [];
}

  async agregarDetalleTurno(turnoId: string, tipo: string, comentario: string, autorId: string) {
  const { error } = await supabase.from('detalles_turno').insert({
    turno_id: turnoId,
    tipo,
    comentario,
    creado_por: autorId,
    creado_en: new Date().toISOString(),
  });
  if (error) throw error;
}


  async cancelarTurno(turnoId: string, motivo: string) {
    const user = await this.auth.getUser();
    const userId = user?.id;

    if (!motivo.trim()) throw new Error('Debe ingresar un motivo de cancelación.');


    const { error: detalleError } = await supabase.from('detalles_turno').insert({
      turno_id: turnoId,
      tipo: 'cancelacion',
      comentario: motivo.trim(),
      creado_por: userId,
    });
    if (detalleError) throw detalleError;

    const { error: updateError } = await supabase
      .from('turnos')
      .update({ estado: 'cancelado' })
      .eq('id', turnoId);
    if (updateError) throw updateError;

    return true;
  }


  async enviarEncuesta(turnoId: string, calificacion: number, comentario: string) {
    const user = await this.auth.getUser();
    const userId = user?.id;

    if (!calificacion || calificacion < 1 || calificacion > 5)
      throw new Error('Calificación inválida.');

    const { error } = await supabase.from('encuestas_turno').insert({
      turno_id: turnoId,
      paciente_id: userId,
      comentario: comentario.trim(),
      calificacion,
    });

    if (error) throw error;
    return true;
  }

  async getResena(turnoId: string) {
  const { data, error } = await supabase
    .from('detalles_turno')
    .select('*')
    .eq('turno_id', turnoId)
    .eq('tipo', 'finalizado')
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

async getTurnosPorEspecialista(especialistaId: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select(`
        id,
        paciente_id,
        especialidad,
        fecha,
        hora,
        estado,
        duracion_min,
        creado_en,
        usuarios_pacientes:paciente_id (nombre, apellido)
      `)
      .eq('especialista_id', especialistaId)
      .order('fecha', { ascending: true });

    if (error) throw error;
    return data || [];
  }

   async getTurnosPorEspecialistaConDetalles(especialistaId: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select(`
        *,
        usuarios_pacientes:paciente_id (nombre, apellido),
        detalles_turno (*)
      `)
      .eq('especialista_id', especialistaId)
      .order('fecha', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async actualizarEstado(turnoId: string, nuevoEstado: string, comentario?: string, tipoComentario?: string, autorId?: string) {
    const { error: updateError } = await supabase
      .from('turnos')
      .update({ estado: nuevoEstado })
      .eq('id', turnoId);

    if (updateError) throw updateError;

    if (comentario) {
      const { error: detalleError } = await supabase.from('detalles_turno').insert({
        turno_id: turnoId,
        tipo: tipoComentario || nuevoEstado,
        comentario,
        creado_por: autorId,
        creado_en: new Date().toISOString(),
      });
      if (detalleError) throw detalleError;
    }
  }

  async getDetallesTurno(turnoId: string) {
    const { data, error } = await supabase
      .from('detalles_turno')
      .select('*')
      .eq('turno_id', turnoId)
      .order('creado_en', { ascending: true });

    if (error) throw error;
    return data || [];
  }

}
