import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Auth } from '../../core/servicios/auth';
import { ToastService } from '../../core/servicios/toast';
import { Loading } from '../../compartido/components/loading/loading';
import { Turnos } from '../../core/servicios/turnos';
import { HeaderPropio } from '../../compartido/components/header/headerPropio';

@Component({
  selector: 'app-mis-turnos-especialista',
  standalone: true,
  templateUrl: './mis-turnos-especialista.html',
  styleUrls: ['./mis-turnos-especialista.scss'],
  imports: [CommonModule, FormsModule, Loading, HeaderPropio],
})
export class MisTurnosEspecialista implements OnInit {
  turnos: any[] = [];
  filtrado: any[] = [];
  filtro = '';
  loading = false;
  especialistaId!: string;

  mostrarModalResena = false;
  detallesSeleccionados: any[] = [];
  turnoSeleccionado: any = null;

  mostrarModalComentario = false;
  accionPendiente = '';
  comentarioAccion = '';

  constructor(
    private turnosSrv: Turnos,
    private auth: Auth,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    const user = await this.auth.getUser();
    if (!user) return;
    this.especialistaId = user.id;
    await this.cargarTurnos();
  }

  async cargarTurnos() {
    this.loading = true;
    try {
      this.turnos = await this.turnosSrv.getTurnosPorEspecialistaConDetalles(this.especialistaId);
      this.filtrado = [...this.turnos];
    } catch (err: any) {
      console.error(err);
      this.toast.show('Error al cargar los turnos.', 'error');
    } finally {
      this.loading = false;
    }
  }

  aplicarFiltro() {
    const texto = this.filtro.toLowerCase().trim();
    this.filtrado = this.turnos.filter(
      (t) =>
        t.especialidad.toLowerCase().includes(texto) ||
        `${t.usuarios_pacientes?.nombre ?? ''} ${t.usuarios_pacientes?.apellido ?? ''}`
          .toLowerCase()
          .includes(texto)
    );
  }

  puedeAceptar(t: any) {
    return !['realizado', 'cancelado', 'rechazado'].includes(t.estado);
  }

  puedeCancelar(t: any) {
    return !['aceptado', 'realizado', 'rechazado'].includes(t.estado);
  }

  puedeRechazar(t: any) {
    return !['aceptado', 'realizado', 'cancelado'].includes(t.estado);
  }

  puedeFinalizar(t: any) {
    return t.estado === 'aceptado';
  }

  puedeVerResena(t: any) {
    return t.detalles_turno?.some((d: any) => d.tipo === 'finalizado');
  }

  async aceptarTurno(turno: any) {
    try {
      await this.turnosSrv.actualizarEstado(turno.id, 'aceptado', undefined, undefined, this.especialistaId);
      this.toast.show('Turno aceptado correctamente.', 'success');
      this.cargarTurnos();
    } catch (err: any) {
      console.error(err);
      this.toast.show('Error al aceptar turno.', 'error');
    }
  }

  abrirModalComentario(turno: any, accion: string) {
    this.turnoSeleccionado = turno;
    this.accionPendiente = accion;
    this.comentarioAccion = '';
    this.mostrarModalComentario = true;
  }

  cerrarModalComentario() {
    this.mostrarModalComentario = false;
    this.turnoSeleccionado = null;
    this.accionPendiente = '';
    this.comentarioAccion = '';
  }

  async confirmarAccion() {
    if (!this.comentarioAccion.trim()) {
      this.toast.show('Debe ingresar un comentario.', 'error');
      return;
    }

    try {
      const idTurno = this.turnoSeleccionado.id;
      const comentario = this.comentarioAccion.trim();
      const accion = this.accionPendiente;

      if (accion === 'finalizado') {
        await this.turnosSrv.actualizarEstado(idTurno, 'realizado', comentario, 'finalizado', this.especialistaId);
      } else if (accion === 'cancelado' || accion === 'rechazado') {
        await this.turnosSrv.actualizarEstado(idTurno, accion, comentario, accion, this.especialistaId);
      }

      this.toast.show(`Turno ${accion} correctamente.`, 'success');
      this.cerrarModalComentario();
      this.cargarTurnos();
    } catch (err: any) {
      console.error(err);
      this.toast.show('Error al actualizar el turno.', 'error');
    }
  }

  async verResena(t: any) {
    try {
      const detalles = await this.turnosSrv.getDetallesTurno(t.id);
      if (detalles.length === 0) {
        this.toast.show('No hay reseñas disponibles para este turno.', 'info');
        return;
      }

      this.detallesSeleccionados = detalles;
      this.turnoSeleccionado = t;
      this.mostrarModalResena = true;
    } catch (err: any) {
      console.error(err);
      this.toast.show('Error al obtener la reseña.', 'error');
    }
  }

  cerrarModalResena() {
    this.mostrarModalResena = false;
    this.detallesSeleccionados = [];
    this.turnoSeleccionado = null;
  }
}
