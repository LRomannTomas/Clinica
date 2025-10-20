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
      .select(
        `
        *,
        especialista:usuarios!turnos_especialista_id_fkey (nombre, apellido),
        detalles_turno(*)
      `
      )
      .eq('paciente_id', userId)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async getTurnosPorPacienteConDetalles(pacienteId: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select(
        `
        *,
        usuarios_especialistas:especialista_id (nombre, apellido),
        detalles_turno (*)
      `
      )
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async cancelarTurno(turnoId: string, motivo: string) {
    const user = await this.auth.getUser();
    const userId = user?.id;

    if (!motivo.trim()) throw new Error('Debe ingresar un motivo de cancelación.');

    const { error: detalleError } = await supabase.from('detalles_turno').insert({
      turno_id: turnoId,
      tipo: 'cancelacion',
      texto: motivo.trim(),
      creado_por: userId,
      creado_en: new Date().toISOString(),
    });
    if (detalleError) throw detalleError;

    const { error: updateError } = await supabase
      .from('turnos')
      .update({ estado: 'cancelado' })
      .eq('id', turnoId);
    if (updateError) throw updateError;

    return true;
  }

  async actualizarEstado(
    turnoId: string,
    nuevoEstado: string,
    comentario?: string,
    tipoComentario?: string,
    autorId?: string
  ) {
    const { error: updateError } = await supabase
      .from('turnos')
      .update({ estado: nuevoEstado })
      .eq('id', turnoId);

    if (updateError) throw updateError;

    if (comentario?.trim()) {
      const tipoFinal = nuevoEstado === 'cancelado' ? 'cancelacion' : tipoComentario || nuevoEstado;

      const { error: detalleError } = await supabase.from('detalles_turno').insert({
        turno_id: turnoId,
        tipo: tipoFinal,
        texto: comentario.trim(),
        creado_por: autorId,
        creado_en: new Date().toISOString(),
      });
      if (detalleError) throw detalleError;
    }
  }

  async agregarDetalleTurno(turnoId: string, tipo: string, contenido: any, autorId: string) {
    const insertData: any = {
      turno_id: turnoId,
      tipo,
      creado_por: autorId,
      creado_en: new Date().toISOString(),
    };

    if (typeof contenido === 'string') {
      insertData.texto = contenido.trim();
    } else {
      insertData.datos = contenido;
    }

    const { error } = await supabase.from('detalles_turno').insert(insertData);
    if (error) throw error;
  }

  async enviarEncuesta(turnoId: string, calificacion: number, comentario: string) {
    const user = await this.auth.getUser();
    const userId = user?.id;

    if (!calificacion || calificacion < 1 || calificacion > 5)
      throw new Error('Calificación inválida.');

    const { error } = await supabase.from('detalles_turno').insert({
      turno_id: turnoId,
      tipo: 'encuesta',
      datos: { calificacion, comentario },
      creado_por: userId,
      creado_en: new Date().toISOString(),
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
      .select(
        `
        id,
        paciente_id,
        especialidad,
        fecha,
        hora,
        estado,
        duracion_min,
        creado_en,
        usuarios_pacientes:paciente_id (nombre, apellido)
      `
      )
      .eq('especialista_id', especialistaId)
      .order('fecha', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getTurnosPorEspecialistaConDetalles(especialistaId: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select(
        `
        *,
        usuarios_pacientes:paciente_id (nombre, apellido),
        detalles_turno (*)
      `
      )
      .eq('especialista_id', especialistaId)
      .order('fecha', { ascending: true });

    if (error) throw error;
    return data || [];
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

  async crearHistoriaClinica(params: {
    turnoId: string;
    pacienteId: string;
    especialistaId: string;
    altura_cm: number;
    peso_kg: number;
    temperatura_c: number;
    presion: string;
    extras?: Array<{ clave: string; valor: string }>;
  }) {
    const {
      turnoId,
      pacienteId,
      especialistaId,
      altura_cm,
      peso_kg,
      temperatura_c,
      presion,
      extras = [],
    } = params;

    if (!turnoId || !pacienteId || !especialistaId) {
      throw new Error('Faltan identificadores obligatorios.');
    }
    if (
      altura_cm == null || peso_kg == null ||
      temperatura_c == null || !presion?.trim()
    ) {
      throw new Error('Todos los datos fijos son obligatorios.');
    }
    if (extras.length > 3) {
      throw new Error('Podés cargar hasta 3 datos extra.');
    }

    const { error } = await supabase.from('historia_clinica').insert({
      turno_id: turnoId,
      paciente_id: pacienteId,
      especialista_id: especialistaId,
      altura_cm,
      peso_kg,
      temperatura_c,
      presion,
      extras,
    });

    if (error) throw error;
    return true;
  }

  async getHistoriaPorPaciente(pacienteId: string) {
    const { data, error } = await supabase
      .from('historia_clinica')
      .select(`
        *,
        turnos:turno_id (fecha, hora, especialidad)
      `)
      .eq('paciente_id', pacienteId)
      .order('creado_en', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getHistoriaPorTurno(turnoId: string) {
    const { data, error } = await supabase
      .from('historia_clinica')
      .select('*')
      .eq('turno_id', turnoId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  async getPacientesAtendidos(especialistaId: string) {
    const { data, error } = await supabase
      .from('historia_clinica')
      .select('paciente_id, creado_en')
      .eq('especialista_id', especialistaId);

    if (error) throw error;

    const idsUnicos = Array.from(new Set((data || []).map((r) => r.paciente_id)));

    if (idsUnicos.length === 0) return [];

    const { data: pacientes, error: errP } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido, email')
      .in('id', idsUnicos);

    if (errP) throw errP;
    return pacientes || [];
  }

  async buscarTurnosConHistoria(params: {
    scope: 'paciente' | 'especialista';
    userId: string;
    texto: string; 
  }) {
    const { scope, userId, texto } = params;
    const q = texto.trim().toLowerCase();

    const baseSel =
      `
      *,
      detalles_turno(*)
      `;

    const turnosQuery = supabase
      .from('turnos')
      .select(baseSel)
      .order('fecha', { ascending: false });

    if (scope === 'paciente') {
      turnosQuery.eq('paciente_id', userId);
    } else {
      turnosQuery.eq('especialista_id', userId);
    }

    const { data: turnos, error: errT } = await turnosQuery;
    if (errT) throw errT;

    if (!q) return turnos || [];

    const idsTurnos = (turnos || []).map((t) => t.id);
    if (idsTurnos.length === 0) return [];

    const { data: historias, error: errH } = await supabase
      .from('historia_clinica')
      .select('turno_id, altura_cm, peso_kg, temperatura_c, presion, extras')
      .in('turno_id', idsTurnos);

    if (errH) throw errH;

    const mapHistoria = new Map(historias?.map((h) => [h.turno_id, h]) || []);


    const coincide = (txt?: string | number) =>
      (txt ?? '').toString().toLowerCase().includes(q);

    const filtrados = (turnos || []).filter((t) => {
      const h = mapHistoria.get(t.id);
      const camposTurno = [
        t.especialidad,
        t.fecha,
        t.hora,
        t.estado,
      ];

      const coincideTurno = camposTurno.some(coincide);

      let coincideHistoria = false;
      if (h) {
        const fijos = [
          h.altura_cm, h.peso_kg, h.temperatura_c, h.presion
        ].map((v) => (v ?? '').toString());

        const dyn = Array.isArray(h.extras)
          ? (h.extras as Array<any>).flatMap((e) => [e?.clave, e?.valor])
          : [];

        coincideHistoria = [...fijos, ...dyn].some(coincide);
      }

      return coincideTurno || coincideHistoria;
    });

    return filtrados;
  }
}
