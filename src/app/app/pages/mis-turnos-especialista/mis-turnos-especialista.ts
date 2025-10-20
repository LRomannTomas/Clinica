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

  

  private accionLabelMap: Record<string, string> = {
    cancelado: 'Cancelar',
    rechazado: 'Rechazar',
    finalizado: 'Finalizar',
  };

  constructor(private turnosSrv: Turnos, private auth: Auth, private toast: ToastService) {}

  async ngOnInit() {
    const user = await this.auth.getUser();
    if (!user) return;
    this.especialistaId = user.id;
    await this.cargarTurnos();
  }

  get accionLabel(): string {
    return this.accionLabelMap[this.accionPendiente] ?? (this.accionPendiente || '');
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
    return !['realizado', 'cancelado', 'rechazado', 'aceptado'].includes(t.estado);
  }

  puedeCancelar(t: any) {
    return !['aceptado', 'realizado', 'rechazado', 'cancelado'].includes(t.estado);
  }

  puedeFinalizar(t: any) {
    return t.estado === 'aceptado';
  }

  puedeVerResena(t: any) {
    return t.detalles_turno?.some((d: any) => d.tipo === 'finalizado' || d.tipo === 'evaluacion');
  }

  async verMotivoCancelacion(t: any) {
  try {
    const detalles = await this.turnosSrv.getDetallesTurno(t.id);
    const motivo = detalles.find((d: any) => d.tipo === 'cancelacion');

    if (!motivo) {
      this.toast.show('No hay motivo de cancelación registrado.', 'info');
      return;
    }

    const autor = this.obtenerAutorCancelacion(motivo);

    this.detallesSeleccionados = [
      {
        tipo: 'cancelacion',
        texto: motivo.texto || motivo.comentario || '(Sin motivo especificado)',
        creado_en: motivo.creado_en,
        autor,
      },
    ];

    this.turnoSeleccionado = t;
    this.mostrarModalResena = true;
  } catch (err: any) {
    console.error(err);
    this.toast.show('Error al obtener el motivo de cancelación.', 'error');
  }
}


  obtenerAutorCancelacion(detalle: any): string {
    if (!detalle?.creado_por) return 'Usuario desconocido';
    if (detalle.creado_por === this.especialistaId) {
      return 'Cancelado por el especialista';
    }
    return 'Cancelado por el paciente';
  }

  async aceptarTurno(turno: any) {
    try {
      await this.turnosSrv.actualizarEstado(
        turno.id,
        'aceptado',
        undefined,
        undefined,
        this.especialistaId
      );
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
        await this.turnosSrv.actualizarEstado(
          idTurno,
          'realizado',
          comentario,
          'finalizado',
          this.especialistaId
        );
      } else if (accion === 'cancelado' || accion === 'rechazado') {
        await this.turnosSrv.actualizarEstado(
          idTurno,
          accion,
          comentario,
          accion,
          this.especialistaId
        );
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

    if (!detalles || detalles.length === 0) {
      this.toast.show('No hay reseñas disponibles para este turno.', 'info');
      return;
    }

    const detalleFinalizado = detalles.find((d: any) => d.tipo === 'finalizado');
    const detalleEvaluacion = detalles.find((d: any) => d.tipo === 'evaluacion');

    this.detallesSeleccionados = [];

    if (detalleFinalizado) {
      this.detallesSeleccionados.push({
        titulo: 'Comentario del especialista',
        contenido: detalleFinalizado.texto || detalleFinalizado.comentario || '(Sin comentario)',
        autor: 'Especialista',
        creado_en: detalleFinalizado.creado_en,
        tipo: 'finalizado',
      });
    }

    if (detalleEvaluacion) {
      let evalData: any;
      try {
        evalData = JSON.parse(detalleEvaluacion.datos || detalleEvaluacion.comentario);
      } catch {
        evalData = {};
      }

      this.detallesSeleccionados.push({
        titulo: 'Evaluación del paciente',
        contenido: `
          <p><strong>Puntuación:</strong> ${evalData.puntuacion ?? '-'} / 10</p>
          <p><strong>Satisfacción:</strong> ${evalData.satisfaccion ?? '-'}</p>
          <p><strong>Recomendación:</strong> ${evalData.recomendacion ?? '-'}</p>
          <p><strong>Comentario:</strong> ${evalData.comentario ?? '-'}</p>
        `,
        autor: 'Paciente',
        creado_en: detalleEvaluacion.creado_en,
        tipo: 'evaluacion',
      });
    }

    if (this.detallesSeleccionados.length === 0) {
      this.toast.show('No hay reseñas disponibles para este turno.', 'info');
      return;
    }

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
