import { Component, OnInit } from '@angular/core';
import { Turnos } from '../../core/servicios/turnos';
import { ToastService } from '../../core/servicios/toast';
import { supabase } from '../../core/supabase/supabase.client';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderPropio } from '../../compartido/components/header/headerPropio';


@Component({
  selector: 'app-turnos-admin',
  imports: [
    CommonModule,        
    FormsModule,         
    DatePipe,            
    TitleCasePipe,       
    HeaderPropio
  ],
  templateUrl: './turnos-admin.html',
  styleUrls: ['./turnos-admin.scss']
})
export class TurnosAdmin implements OnInit {
  turnos: any[] = [];
  filtro: string = '';
  tipoFiltro: 'especialidad' | 'especialista' = 'especialidad';
  cargando = true;

  mostrarModal = false;
  turnoSeleccionado: any = null;
  comentarioCancelacion: string = '';

  constructor(private turnosSrv: Turnos, private toast: ToastService) {}

  async ngOnInit() {
    await this.cargarTurnos();
  }

  async cargarTurnos() {
    this.cargando = true;
    const { data, error } = await supabase
      .from('turnos')
      .select(`
        id, especialidad, estado, fecha, hora,
        pacientes:paciente_id (nombre, apellido),
        especialistas:especialista_id (nombre, apellido)
      `)
      .order('fecha', { ascending: false });

    if (error) {
      console.error(error);
      this.toast.show('Error al cargar los turnos', 'error');
    } else {
      this.turnos = data ?? [];
    }

    this.cargando = false;
  }

  get turnosFiltrados() {
    if (!this.filtro.trim()) return this.turnos;
    const f = this.filtro.toLowerCase();
    return this.turnos.filter(t => {
      if (this.tipoFiltro === 'especialidad')
        return t.especialidad?.toLowerCase().includes(f);
      if (this.tipoFiltro === 'especialista')
        return `${t.especialistas?.nombre} ${t.especialistas?.apellido}`.toLowerCase().includes(f);
      return true;
    });
  }

  puedeCancelar(turno: any): boolean {
    return !['aceptado', 'realizado', 'rechazado', 'cancelado'].includes(turno.estado);
  }

  abrirModal(turno: any) {
    this.turnoSeleccionado = turno;
    this.mostrarModal = true;
    this.comentarioCancelacion = '';
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.turnoSeleccionado = null;
    this.comentarioCancelacion = '';
  }

  async confirmarCancelacion() {
  if (!this.comentarioCancelacion.trim()) {
    this.toast.show('Debe ingresar un motivo para cancelar el turno.', 'error');
    return;
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('No se pudo obtener el usuario autenticado.');

    await this.turnosSrv.actualizarEstado(
      this.turnoSeleccionado.id,
      'cancelado',
      this.comentarioCancelacion,
      'cancelado',
      user.id 
    );

    this.toast.show('Turno cancelado correctamente.', 'success');
    this.cerrarModal();
    this.cargarTurnos();
  } catch (err) {
    console.error(err);
    this.toast.show('Error al cancelar el turno.', 'error');
  }
}

}
