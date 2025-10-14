import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../core/supabase/supabase.client';
import { ToastService } from '../../core/servicios/toast';
import { Auth } from '../../core/servicios/auth';
import { HeaderPropio } from '../../compartido/components/header/headerPropio';

@Component({
  selector: 'app-solicitar-turno',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderPropio],
  templateUrl: './solicitar-turno.html',
  styleUrls: ['./solicitar-turno.scss'],
})
export class SolicitarTurno implements OnInit {
  especialidades: string[] = [];
  especialistas: any[] = [];
  pacientes: any[] = [];

  especialidadSeleccionada: string = '';
  especialistaSeleccionado: any = null;
  pacienteSeleccionado: any = null;
  fechaSeleccionada: string = '';
  horaSeleccionada: string = '';

  fechasDisponibles: string[] = [];
  horariosDisponibles: string[] = [];
  horariosEspecialista: any[] = [];

  esAdmin = false;

  constructor(private toast: ToastService, private auth: Auth) {}

  async ngOnInit() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('perfil')
      .eq('id', user.id)
      .single();

    this.esAdmin = usuario?.perfil === 'admin';
    await this.cargarEspecialidades();
    if (this.esAdmin) await this.cargarPacientes();
  }

  async cargarEspecialidades() {
    const { data, error } = await supabase.from('especialistas').select('especialidad');
    if (error) {
      console.error(error);
      this.toast.show('Error al cargar especialidades', 'error');
      return;
    }
    this.especialidades = [...new Set(data.flatMap((e) => e.especialidad))];
  }

  async cargarEspecialistas() {
    if (!this.especialidadSeleccionada) return;

    const espSeleccionada = this.especialidadSeleccionada.trim().toLowerCase();

    const { data, error } = await supabase.from('especialistas').select(`
    id,
    especialidad,
    foto_url,
    usuarios:id (nombre, apellido)
  `);

    if (error) {
      console.error('Error cargando especialistas:', error);
      this.toast.show('Error al cargar especialistas', 'error');
      return;
    }

    this.especialistas = (data ?? []).filter((esp: any) =>
      (esp.especialidad ?? [])
        .map((v: string) =>
          v
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
        )
        .includes(espSeleccionada.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    );

    console.log('Especialistas filtrados:', this.especialistas);
  }

  async seleccionarEspecialista(esp: any) {
    this.especialistaSeleccionado = esp;
    this.fechaSeleccionada = '';
    this.horaSeleccionada = '';
    this.horariosDisponibles = [];

    const { data, error } = await supabase
      .from('horarios_especialistas')
      .select('*')
      .eq('especialista_id', esp.id)
      .eq('activo', true);

    if (error) {
      console.error(error);
      this.toast.show('Error al cargar horarios del especialista', 'error');
      return;
    }

    this.horariosEspecialista = data ?? [];
    console.log('Horarios encontrados para el especialista:', this.horariosEspecialista);

    this.generarFechasDisponibles();
  }

  generarFechasDisponibles() {
    const hoy = new Date();
    this.fechasDisponibles = [];

    const diasActivos = this.horariosEspecialista.map((h) => h.dia_semana.toLowerCase());

    for (let i = 0; i < 15; i++) {
      const fecha = new Date();
      fecha.setDate(hoy.getDate() + i);

      const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();

      if (diasActivos.includes(diaSemana)) {
        this.fechasDisponibles.push(fecha.toISOString().split('T')[0]);
      }
    }
  }
  async cargarHorariosDisponibles() {
    if (!this.fechaSeleccionada || !this.horariosEspecialista.length) return;

    const fecha = new Date(this.fechaSeleccionada);
    const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();

    const horario = this.horariosEspecialista.find((h) => h.dia_semana.toLowerCase() === diaSemana);
    if (!horario) {
      this.horariosDisponibles = [];
      return;
    }

    const [horaIniH, horaIniM] = horario.hora_inicio.split(':').map(Number);
    const [horaFinH, horaFinM] = horario.hora_fin.split(':').map(Number);

    const inicio = new Date(0, 0, 0, horaIniH, horaIniM);
    const fin = new Date(0, 0, 0, horaFinH, horaFinM);

    const horarios: string[] = [];
    for (let h = new Date(inicio); h < fin; h.setMinutes(h.getMinutes() + 30)) {
      const hh = h.getHours().toString().padStart(2, '0');
      const mm = h.getMinutes().toString().padStart(2, '0');
      horarios.push(`${hh}:${mm}`);
    }

    const { data: turnosOcupados, error } = await supabase
      .from('turnos')
      .select('hora')
      .eq('especialista_id', this.especialistaSeleccionado.id)
      .eq('fecha', this.fechaSeleccionada)
      .not('estado', 'in', '(cancelado,rechazado)');

    if (error) {
      console.error(error);
      this.toast.show('Error al cargar los turnos ocupados', 'error');
      return;
    }

    const horasOcupadas = turnosOcupados?.map((t) => t.hora.slice(0, 5)) ?? [];

    this.horariosDisponibles = horarios.filter((h) => !horasOcupadas.includes(h));
  }

  async cargarPacientes() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido')
      .eq('perfil', 'paciente');

    if (error) {
      console.error(error);
      this.toast.show('Error al cargar pacientes', 'error');
      return;
    }

    this.pacientes = data ?? [];
  }

  async confirmarTurno() {
    if (!this.especialistaSeleccionado || !this.fechaSeleccionada || !this.horaSeleccionada) {
      this.toast.show('Debe completar todos los campos', 'error');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const pacienteId = this.esAdmin ? this.pacienteSeleccionado : user?.id;

    const { error } = await supabase.from('turnos').insert({
      especialidad: this.especialidadSeleccionada,
      especialista_id: this.especialistaSeleccionado.id,
      paciente_id: pacienteId,
      fecha: this.fechaSeleccionada,
      hora: this.horaSeleccionada,
      estado: 'pendiente',
    });

    if (error) {
      console.error(error);
      this.toast.show('Error al solicitar el turno', 'error');
      return;
    }

    this.toast.show('Turno solicitado correctamente.', 'success');
    this.resetearFormulario();
  }

  resetearFormulario() {
    this.especialidadSeleccionada = '';
    this.especialistaSeleccionado = null;
    this.fechaSeleccionada = '';
    this.horaSeleccionada = '';
    this.pacienteSeleccionado = null;
    this.horariosDisponibles = [];
    this.horariosEspecialista = [];
  }

  formatearFecha(fecha: string): string {
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
    };
    return new Date(fecha)
      .toLocaleDateString('es-ES', opciones)
      .replace(/^\w/, (c) => c.toUpperCase());
  }
}
