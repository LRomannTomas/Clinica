import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Auth } from '../../core/servicios/auth';
import { ToastService } from '../../core/servicios/toast';
import { Loading } from '../../compartido/components/loading/loading';
import { Turnos } from '../../core/servicios/turnos';
import { HeaderPropio } from '../../compartido/components/header/headerPropio';

@Component({
  selector: 'app-mis-turnos-paciente',
  standalone: true,
  templateUrl: './mis-turnos.html',
  styleUrls: ['./mis-turnos.scss'],
  imports: [CommonModule, FormsModule, Loading, HeaderPropio],
})
export class MisTurnos implements OnInit {
  turnos: any[] = [];
  filtrado: any[] = [];
  filtro = '';
  loading = false;
  pacienteId!: string;

  mostrarModalResena = false;
  detallesSeleccionados: any[] = [];
  turnoSeleccionado: any = null;

  mostrarModalEvaluacion = false;
  comentario = '';
  puntuacion: number | null = null;
  respuestas: { [key: string]: string } = {};

  mostrarModalAccion = false;
  accionPendiente = '';
  comentarioAccion = '';

  constructor(private turnosSrv: Turnos, private auth: Auth, private toast: ToastService) {}

  async ngOnInit() {
    const user = await this.auth.getUser();
    if (!user) return;
    this.pacienteId = user.id;
    await this.cargarTurnos();
  }

  async cargarTurnos() {
    this.loading = true;
    try {
      this.turnos = await this.turnosSrv.getTurnosPorPacienteConDetalles(this.pacienteId);
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
        `${t.usuarios_especialistas?.nombre ?? ''} ${t.usuarios_especialistas?.apellido ?? ''}`
          .toLowerCase()
          .includes(texto)
    );
  }

  puedeCancelar(t: any) {
    return !['realizado', 'cancelado'].includes(t.estado);
  }

  puedeVerResena(t: any) {
    return t.detalles_turno?.some((d: any) => d.tipo === 'finalizado' || d.tipo === 'evaluacion');
  }

  puedeEvaluar(t: any) {
    return t.estado === 'realizado' && !t.detalles_turno?.some((d: any) => d.tipo === 'evaluacion');
  }

  abrirModalEvaluacion(turno: any) {
    this.turnoSeleccionado = turno;
    this.mostrarModalEvaluacion = true;
    this.puntuacion = null;
    this.comentario = '';
    this.respuestas = {};
  }

  cerrarModalEvaluacion() {
    this.mostrarModalEvaluacion = false;
    this.turnoSeleccionado = null;
    this.puntuacion = null;
    this.comentario = '';
    this.respuestas = {};
  }

  async enviarEvaluacion() {
    if (!this.puntuacion) {
      this.toast.show('Debe seleccionar una puntuación.', 'error');
      return;
    }

    if (!this.comentario.trim()) {
      this.toast.show('Debe ingresar un comentario.', 'error');
      return;
    }

    const feedback = {
      puntuacion: this.puntuacion,
      comentario: this.comentario.trim(),
      ...this.respuestas,
    };

    try {
      await this.turnosSrv.agregarDetalleTurno(
        this.turnoSeleccionado.id,
        'evaluacion',
        JSON.stringify(feedback),
        this.pacienteId
      );

      this.toast.show('¡Gracias por tu evaluación!', 'success');
      this.cerrarModalEvaluacion();
      this.cargarTurnos();
    } catch (err: any) {
      console.error(err);
      this.toast.show('Error al enviar la evaluación.', 'error');
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
          fecha: detalleFinalizado.creado_en,
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
          fecha: detalleEvaluacion.creado_en,
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

  getAccionTitulo(accion: string): string {
    switch (accion) {
      case 'cancelado':
        return 'Cancelar Turno';
      case 'finalizado':
        return 'Finalizar Turno';
      case 'rechazado':
        return 'Rechazar Turno';
      default:
        return accion ? accion.charAt(0).toUpperCase() + accion.slice(1) + ' Turno' : 'Acción';
    }
  }

  obtenerAutorCancelacion(detalle: any): string {
    if (!detalle?.creado_por) return 'Usuario desconocido';
    if (detalle.creado_por === this.pacienteId) {
      return 'Cancelado por el paciente';
    }
    return 'Cancelado por el especialista';
  }

  cerrarModalResena() {
    this.mostrarModalResena = false;
    this.detallesSeleccionados = [];
    this.turnoSeleccionado = null;
  }

  abrirModalAccion(turno: any, accion: string) {
    this.turnoSeleccionado = turno;
    this.accionPendiente = accion;
    this.comentarioAccion = '';
    this.mostrarModalAccion = true;
  }

  cerrarModalAccion() {
    this.mostrarModalAccion = false;
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
      await this.turnosSrv.actualizarEstado(
        this.turnoSeleccionado.id,
        'cancelado',
        this.comentarioAccion,
        'cancelado',
        this.pacienteId
      );

      this.toast.show('Turno cancelado correctamente.', 'success');
      this.cerrarModalAccion();
      this.cargarTurnos();
    } catch (err: any) {
      console.error(err);
      this.toast.show('Error al cancelar el turno.', 'error');
    }
  }
}
