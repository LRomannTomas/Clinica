import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../core/supabase/supabase.client';
import { ToastService } from '../../core/servicios/toast';
import { HeaderPropio } from '../../compartido/components/header/headerPropio';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderPropio],
  templateUrl: './mi-perfil.html',
  styleUrls: ['./mi-perfil.scss'],
})
export class MiPerfil implements OnInit {
  user: any = null;
  perfil: string = '';
  fotoUrl: string | null = null;
  especialidades: string[] = [];
  horarios: any[] = [];

  paso: number = 1;

  nuevo = {
    especialidad: '',
    dia_semana: '',
    hora_inicio: '',
    hora_fin: '',
  };

  dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

  horasDisponibles: string[] = [];
  horaInicioSeleccionada: string = '';
  horaFinCalculada: string = '';

  constructor(private toast: ToastService, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido, perfil')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error(userError);
      this.toast.show('Error al cargar datos del usuario', 'error');
      return;
    }

    this.user = usuario;
    this.perfil = usuario?.perfil;

    if (this.perfil === 'especialista') {
      const { data, error } = await supabase
        .from('especialistas')
        .select('foto_url, especialidad')
        .eq('id', this.user.id)
        .single();

      if (error) {
        console.error(error);
        this.toast.show('Error al cargar datos del especialista', 'error');
        return;
      }

      this.fotoUrl = data?.foto_url ?? null;
      this.especialidades = data?.especialidad ?? [];

      await this.cargarHorarios();
    } else if (this.perfil === 'paciente') {
      const { data, error } = await supabase
        .from('pacientes')
        .select('fotos_url')
        .eq('id', this.user.id)
        .single();

      if (error) {
        console.error(error);
        this.toast.show('Error al cargar datos del paciente', 'error');
        return;
      }

      this.fotoUrl = data?.fotos_url?.[0] ?? null;
    }
  }

  async cargarHorarios() {
    const { data, error } = await supabase
      .from('horarios_especialistas')
      .select('*')
      .eq('especialista_id', this.user.id);

    if (error) {
      console.error(error);
      this.toast.show('Error al cargar horarios', 'error');
      return;
    }

    this.horarios = data ?? [];
  }

  generarHorasDisponibles() {
    this.horasDisponibles = [];
    const horaInicial = 7.5; 
    const horaFinal = 15; 
    for (let h = horaInicial; h <= horaFinal; h += 0.5) {
      const horas = Math.floor(h);
      const minutos = h % 1 === 0 ? '00' : '30';
      this.horasDisponibles.push(`${horas.toString().padStart(2, '0')}:${minutos}`);
    }
  }

  seleccionarHoraInicio(hora: string) {
    this.horaInicioSeleccionada = hora;
    const [h, m] = hora.split(':').map(Number);
    const inicio = new Date(0, 0, 0, h, m);
    const fin = new Date(inicio.getTime() + 8 * 60 * 60 * 1000);
    const hh = fin.getHours().toString().padStart(2, '0');
    const mm = fin.getMinutes().toString().padStart(2, '0');
    this.horaFinCalculada = `${hh}:${mm}`;

    this.nuevo.hora_inicio = hora;
    this.nuevo.hora_fin = this.horaFinCalculada;
  }


  async guardarHorario() {
    if (
      !this.nuevo.especialidad ||
      !this.nuevo.dia_semana ||
      !this.nuevo.hora_inicio ||
      !this.nuevo.hora_fin
    ) {
      this.toast.show('Complete todos los campos.', 'error');
      return;
    }

    const { error } = await supabase.from('horarios_especialistas').insert({
      especialista_id: this.user.id,
      especialidad: this.nuevo.especialidad,
      dia_semana: this.nuevo.dia_semana,
      hora_inicio: this.nuevo.hora_inicio,
      hora_fin: this.nuevo.hora_fin,
      activo: true,
    });

    if (error) {
      console.error(error);
      this.toast.show('Error al guardar horario', 'error');
      return;
    }

    this.toast.show('Horario agregado correctamente.', 'success');

    this.nuevo = { especialidad: '', dia_semana: '', hora_inicio: '', hora_fin: '' };
    await this.cargarHorarios();
    this.paso = 4;
  }

  async cambiarEstado(h: any) {
    const { error } = await supabase
      .from('horarios_especialistas')
      .update({ activo: !h.activo })
      .eq('id', h.id);

    if (error) {
      console.error(error);
      this.toast.show('Error al cambiar estado del horario', 'error');
      return;
    }

    this.toast.show('Estado actualizado', 'success');
    this.cargarHorarios();
  }

  irAPaso(nuevoPaso: number) {
    this.paso = nuevoPaso;
    if (nuevoPaso === 3) {
      this.generarHorasDisponibles();
    }
  }

  nuevoHorario() {
    this.nuevo = { especialidad: '', dia_semana: '', hora_inicio: '', hora_fin: '' };
    this.horaInicioSeleccionada = '';
    this.horaFinCalculada = '';
    this.paso = 1;
  }
}
