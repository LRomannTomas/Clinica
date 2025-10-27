import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Auth } from '../../core/servicios/auth';
import { ToastService } from '../../core/servicios/toast';
import { Loading } from '../../compartido/components/loading/loading';
import { Turnos } from '../../core/servicios/turnos';
import { HeaderPropio } from '../../compartido/components/header/headerPropio';
import { BotonColorDirective } from '../../compartido/directivas/boton-color';
import { NombreCompletoPipe } from '../../compartido/pipes/nombre-completo-pipe';
import { EmptyPipe } from '../../compartido/pipes/empty-pipe';


@Component({
  selector: 'app-mis-turnos-especialista',
  standalone: true,
  templateUrl: './mis-turnos-especialista.html',
  styleUrls: ['./mis-turnos-especialista.scss'],
  imports: [CommonModule, FormsModule, Loading, HeaderPropio,BotonColorDirective, NombreCompletoPipe, EmptyPipe],
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

  private filtroTimer: any = null;

  historia = {
    altura_cm: null,
    peso_kg: null,
    temperatura_c: null,
    presion: '',
  };

  extras: Array<{ clave: string; valor: string }> = [{ clave: '', valor: '' }];

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

  aplicarFiltroConDebounce() {
    clearTimeout(this.filtroTimer);
    this.filtroTimer = setTimeout(() => this.aplicarFiltro(), 500);
  }

  async aplicarFiltro() {
    const texto = this.filtro.toLowerCase().trim();

    if (!texto) {
      this.filtrado = [...this.turnos];
      return;
    }

    try {
      this.loading = true;

      const resultados = await this.turnosSrv.buscarTurnosConHistoria({
        scope: 'especialista',
        userId: this.especialistaId,
        texto,
      });

      this.filtrado = resultados;
    } catch (err: any) {
      console.error(err);
      this.toast.show('Error al aplicar el filtro de búsqueda.', 'error');
    } finally {
      this.loading = false;
    }
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
    this.historia = { altura_cm: null, peso_kg: null, temperatura_c: null, presion: '' };
    this.extras = [{ clave: '', valor: '' }];
  }

  cerrarModalComentario() {
    this.mostrarModalComentario = false;
    this.turnoSeleccionado = null;
    this.accionPendiente = '';
    this.comentarioAccion = '';
  }

  async confirmarAccion() {
    if (this.accionPendiente === 'finalizado') {
      if (
        !this.historia.altura_cm ||
        !this.historia.peso_kg ||
        !this.historia.temperatura_c ||
        !this.historia.presion
      ) {
        this.toast.show('Completá todos los datos obligatorios de la historia clínica.', 'error');
        return;
      }

      for (const extra of this.extras) {
        const tieneClave = extra.clave?.trim() !== '';
        const tieneValor = extra.valor?.trim() !== '';

        if (tieneClave && !tieneValor) {
          this.toast.show(`El campo "${extra.clave}" debe tener un valor.`, 'error');
          return;
        }

        if (!tieneClave && tieneValor) {
          this.toast.show('No podés ingresar un valor sin especificar una clave.', 'error');
          return;
        }

        if (!this.comentarioAccion.trim()) {
          this.toast.show('Debés dejar un comentario para el paciente.', 'error');
          return;
        }
      }
    } else {
      if (!this.comentarioAccion.trim()) {
        this.toast.show('Debe ingresar un comentario.', 'error');
        return;
      }
    }

    try {
      const idTurno = this.turnoSeleccionado.id;
      const accion = this.accionPendiente;

      if (accion === 'finalizado') {
        await this.turnosSrv.actualizarEstado(
          idTurno,
          'realizado',
          this.comentarioAccion.trim(),
          'finalizado',
          this.especialistaId
        );

        await this.turnosSrv.crearHistoriaClinica({
          turnoId: idTurno,
          pacienteId: this.turnoSeleccionado.paciente_id,
          especialistaId: this.especialistaId,
          altura_cm: Number(this.historia.altura_cm),
          peso_kg: Number(this.historia.peso_kg),
          temperatura_c: Number(this.historia.temperatura_c),
          presion: this.historia.presion,
          extras: this.extras.filter((e) => e.clave && e.valor),
        });
      } else if (accion === 'cancelado' || accion === 'rechazado') {
        await this.turnosSrv.actualizarEstado(
          idTurno,
          accion,
          this.comentarioAccion.trim(),
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

  agregarExtra() {
    if (this.extras.length < 3) {
      this.extras.push({ clave: '', valor: '' });
    } else {
      this.toast.show('Solo se permiten hasta 3 campos adicionales.', 'info');
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
          if (typeof detalleEvaluacion.datos === 'string') {
            evalData = JSON.parse(detalleEvaluacion.datos);
          } else if (
            typeof detalleEvaluacion.datos === 'object' &&
            detalleEvaluacion.datos !== null
          ) {
            evalData = detalleEvaluacion.datos;
          } else if (detalleEvaluacion.comentario) {
            evalData = JSON.parse(detalleEvaluacion.comentario);
          } else {
            evalData = {};
          }
        } catch (e) {
          console.error('Error al parsear evaluación:', e, detalleEvaluacion);
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
