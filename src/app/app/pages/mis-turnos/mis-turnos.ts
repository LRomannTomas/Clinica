import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../core/supabase/supabase.client';
import { Auth } from '../../core/servicios/auth';
import { ToastService } from '../../core/servicios/toast';
import { Loading } from '../../compartido/components/loading/loading';

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule, Loading],
  templateUrl: './mis-turnos.html',
  styleUrls: ['./mis-turnos.scss']
})
export class MisTurnos implements OnInit {

  turnos: any[] = [];
  turnosFiltrados: any[] = [];
  loading = false;

  filtro = '';
  tipoFiltro: 'especialidad' | 'especialista' = 'especialidad';
  userId: string | null = null;

  constructor(
    private auth: Auth,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    await this.cargarTurnos();
  }

  async cargarTurnos() {
    this.loading = true;
    try {
      const user = await this.auth.getUser();
      this.userId = user?.id ?? null;
      if (!this.userId) return;

      const { data, error } = await supabase
        .from('turnos')
        .select(`
          *,
          especialista:usuarios!turnos_especialista_id_fkey (nombre, apellido),
          detalles_turno(*)
        `)
        .eq('paciente_id', this.userId)
        .order('fecha', { ascending: false });

      if (error) throw error;
      this.turnos = data ?? [];
      this.turnosFiltrados = this.turnos;
    } catch (err) {
      console.error(err);
      this.toast.show('Error al cargar los turnos', 'error');
    } finally {
      this.loading = false;
    }
  }

  aplicarFiltro() {
    const valor = this.filtro.trim().toLowerCase();
    if (!valor) {
      this.turnosFiltrados = this.turnos;
      return;
    }

    if (this.tipoFiltro === 'especialidad') {
      this.turnosFiltrados = this.turnos.filter(t => 
        t.especialidad.toLowerCase().includes(valor)
      );
    } else {
      this.turnosFiltrados = this.turnos.filter(t =>
        `${t.especialista?.nombre ?? ''} ${t.especialista?.apellido ?? ''}`
          .toLowerCase()
          .includes(valor)
      );
    }
  }

  async cancelarTurno(turno: any) {
    const motivo = prompt('Ingrese el motivo de la cancelación:');
    if (!motivo) return;

    try {
      await supabase.from('detalles_turno').insert({
        turno_id: turno.id,
        tipo: 'cancelacion',
        comentario: motivo,
        creado_por: this.userId
      });

      await supabase.from('turnos').update({ estado: 'cancelado' }).eq('id', turno.id);

      this.toast.show('Turno cancelado correctamente', 'success');
      this.cargarTurnos();
    } catch (err) {
      console.error(err);
      this.toast.show('Error al cancelar el turno', 'error');
    }
  }

  puedeCancelar(t: any): boolean {
    return ['pendiente', 'aceptado'].includes(t.estado);
  }

  puedeVerReseña(t: any): boolean {
    return t.detalles_turno?.some((d: any) => d.tipo === 'finalizacion');
  }

  puedeCompletarEncuesta(t: any): boolean {
    return t.estado === 'realizado' && this.puedeVerReseña(t);
  }

  async completarEncuesta(turno: any) {
    const comentario = prompt('Comentario sobre la atención:');
    const calificacion = Number(prompt('Calificación del 1 al 5:'));
    if (!comentario || !calificacion) return;

    try {
      await supabase.from('encuestas_turno').insert({
        turno_id: turno.id,
        paciente_id: this.userId,
        comentario,
        calificacion
      });

      this.toast.show('Encuesta enviada correctamente', 'success');
    } catch (err) {
      console.error(err);
      this.toast.show('Error al enviar la encuesta', 'error');
    }
  }
}
