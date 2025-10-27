import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { supabase } from '../../core/supabase/supabase.client';
import { Loading } from '../../compartido/components/loading/loading';
import { Auth } from '../../core/servicios/auth';
import { Almacenamiento } from '../../core/servicios/almacenamiento';
import { Router } from '@angular/router';
import { ToastService } from '../../core/servicios/toast';
import { HeaderPropio } from '../../compartido/components/header/headerPropio';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Turnos } from '../../core/servicios/turnos';
import { NombreCompletoPipe } from '../../compartido/pipes/nombre-completo-pipe';
import { DniPipe } from '../../compartido/pipes/dni-pipe';
import { EmptyPipe } from '../../compartido/pipes/empty-pipe';
import { BotonColorDirective } from '../../compartido/directivas/boton-color';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.scss'],
  imports: [CommonModule, ReactiveFormsModule, Loading, FormsModule, HeaderPropio,NombreCompletoPipe, DniPipe, EmptyPipe, BotonColorDirective],
})
export class Usuarios implements OnInit {
  vista: 'tabla' | 'tipo' | 'form' = 'tabla';
  tipoSeleccionado: 'admin' | 'especialista' | 'paciente' | null = null;

  usuarios: any[] = [];
  loading = false;
  mensaje = '';

  mostrarModal = false;
  pacienteSeleccionado: any = null;
  historiasSeleccionadas: any[] = [];

  especialidades = [
    { nombre: 'Cardiología', archivo: 'cardiologia.png' },
    { nombre: 'Dermatología', archivo: 'dermatologia.png' },
    { nombre: 'Neurología', archivo: 'neurologia.png' },
    { nombre: 'Otra', archivo: 'otra.png' },
  ];

  especialidadesSeleccionadas: string[] = [];
  mostrarOtraEspecialidad = false;
  nuevaEspecialidad = '';

  form!: FormGroup;
  fotos: File[] = [];

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private auth: Auth,
    private almacenamiento: Almacenamiento,
    private router: Router,
    private toast: ToastService,
    private turnosSrv: Turnos,

  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: [null, [Validators.required, Validators.min(1)]],
      dni: ['', [Validators.required, Validators.minLength(7)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      perfil: ['', Validators.required],
      especialidad: [''],
      obra_social: [''],
    });

    this.cargarUsuarios();
  }


  async verHistoria(paciente: any) {
  this.loading = true;
  try {
    const historias = await this.turnosSrv.getHistoriaPorPaciente(paciente.id);
    this.historiasSeleccionadas = historias;
    this.pacienteSeleccionado = paciente;
    this.mostrarModal = true;
  } catch (err) {
    console.error(err);
    this.toast.show('Error al cargar la historia clínica.', 'error');
  } finally {
    this.loading = false;
  }
}

cerrarModal() {
  this.mostrarModal = false;
  this.historiasSeleccionadas = [];
  this.pacienteSeleccionado = null;
}

  async cargarUsuarios() {
  this.loading = true;
  this.mensaje = '';
  try {
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('perfil', { ascending: true });

    if (error) throw error;
    if (!usuarios || usuarios.length === 0) {
      this.usuarios = [];
      this.mensaje = 'No hay usuarios registrados.';
      return;
    }

    const usuariosConFotos = await Promise.all(
      usuarios.map(async (u: any) => {
        let foto = null;

        if (u.perfil === 'especialista') {
          const { data: esp } = await supabase
            .from('especialistas')
            .select('foto_url')
            .eq('id', u.id)
            .single();

          foto = esp?.foto_url || 'assets/images/medico.png';
        } 
        else if (u.perfil === 'paciente') {
          const { data: pac } = await supabase
            .from('pacientes')
            .select('fotos_url')
            .eq('id', u.id)
            .single();

          foto = pac?.fotos_url?.[0] || 'assets/images/paciente.png';
        } 
        else if (u.perfil === 'admin') {
          foto = 'assets/images/admin.png';
        }

        return { ...u, foto };
      })
    );

    this.usuarios = usuariosConFotos;
  } catch (err) {
    console.error(err);
    this.mensaje = 'Error al cargar los usuarios.';
  } finally {
    this.loading = false;
  }
}


  irA(vista: 'tabla' | 'tipo' | 'form') {
    this.vista = vista;
  }

  seleccionarTipo(tipo: 'admin' | 'especialista' | 'paciente') {
    this.tipoSeleccionado = tipo;
    this.form.patchValue({ perfil: tipo });
    this.irA('form');
  }

  volverAlInicio() {
    this.vista = 'tabla';
    this.tipoSeleccionado = null;
    this.form.reset();
    this.fotos = [];
  }

  volverASeleccion() {
    this.vista = 'tipo';
    this.tipoSeleccionado = null;
    this.form.reset();
    this.fotos = [];
  }

  async toggleAprobado(usuario: any) {
    const nuevoEstado = !usuario.aprobado;
    const accion = nuevoEstado ? 'aprobar' : 'inhabilitar';
    if (!confirm(`¿Seguro que querés ${accion} a ${usuario.nombre} ${usuario.apellido}?`)) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ aprobado: nuevoEstado })
        .eq('id', usuario.id);
      if (error) throw error;

      usuario.aprobado = nuevoEstado;
      this.toast.show(
        `Especialista ${nuevoEstado ? 'habilitado' : 'inhabilitado'} correctamente.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      this.toast.show('No se pudo actualizar el estado del usuario.', 'error');
    }
  }

  async eliminarUsuario(usuario: any) {
    if (!confirm(`¿Seguro que querés eliminar al usuario ${usuario.nombre}?`)) return;

    try {
      if (usuario.perfil === 'paciente') {
        await supabase.from('pacientes').delete().eq('id', usuario.id);
      } else if (usuario.perfil === 'especialista') {
        await supabase.from('especialistas').delete().eq('id', usuario.id);
      }

      await supabase.from('usuarios').delete().eq('id', usuario.id);

      await fetch('https://ubeppzmaerryzknxqjso.supabase.co/functions/v1/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: usuario.id }),
      });

      this.toast.show('Usuario eliminado correctamente.', 'success');
      this.usuarios = this.usuarios.filter((u) => u.id !== usuario.id);
    } catch (err) {
      console.error(err);
      this.toast.show('Error al eliminar usuario.', 'error');
    }
  }

  async descargarExcel() {
    try {
      if (!this.usuarios || this.usuarios.length === 0) {
        this.toast.show('No hay usuarios para exportar.', 'info');
        return;
      }

      const datos = this.usuarios.map((u) => ({
        ID: u.id,
        Nombre: u.nombre,
        Apellido: u.apellido,
        Email: u.email,
        Perfil: u.perfil,
        Edad: u.edad ?? '-',
        DNI: u.dni ?? '-',
        Aprobado: u.perfil === 'especialista' ? (u.aprobado ? 'Sí' : 'No') : '-',
      }));

      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const fecha = new Date().toISOString().split('T')[0];
      saveAs(blob, `usuarios_clinica_${fecha}.xlsx`);

      this.toast.show('Archivo Excel descargado correctamente.', 'success');
    } catch (err) {
      console.error(err);
      this.toast.show('Error al generar el archivo Excel.', 'error');
    }
  }

  scrollCarrusel(direccion: 'izquierda' | 'derecha') {
    const carrusel = document.querySelector('.carrusel');
    if (!carrusel) return;
    const scrollAmount = 150;
    carrusel.scrollBy({
      left: direccion === 'derecha' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  }

  toggleEspecialidad(nombre: string) {
    if (nombre === 'Otra') {
      this.mostrarOtraEspecialidad = !this.mostrarOtraEspecialidad;

      if (this.mostrarOtraEspecialidad) {
        if (!this.especialidadesSeleccionadas.includes('Otra')) {
          this.especialidadesSeleccionadas.push('Otra');
        }
      } else {
        this.especialidadesSeleccionadas = this.especialidadesSeleccionadas.filter(
          (esp) => esp !== 'Otra'
        );
        this.nuevaEspecialidad = '';
      }
      return;
    }

    const index = this.especialidadesSeleccionadas.indexOf(nombre);
    if (index >= 0) {
      this.especialidadesSeleccionadas.splice(index, 1);
    } else {
      this.especialidadesSeleccionadas.push(nombre);
    }
  }

  onFotosSeleccionadas(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? (Array.from(input.files) as File[]) : [];
    const maxFotos = this.form.value.perfil === 'paciente' ? 2 : 1;
    this.fotos = files.slice(0, maxFotos);
  }

  async crearUsuario() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toast.show('Complete correctamente los campos requeridos.', 'error');
      return;
    }

    const { nombre, apellido, edad, dni, email, password, perfil, especialidad, obra_social } =
      this.form.value;

    if (perfil === 'paciente' && this.fotos.length !== 2) {
      this.toast.show('El paciente debe tener 2 imágenes.', 'error');
      return;
    }
    if (perfil === 'especialista' && this.fotos.length !== 1) {
      this.toast.show('El especialista debe tener una imagen.', 'error');
      return;
    }

    let especialidadesFinal: string[] = [];
    if (perfil === 'especialista') {
      let seleccionadas = this.especialidadesSeleccionadas.filter((esp) => esp !== 'Otra');

      if (this.mostrarOtraEspecialidad && this.nuevaEspecialidad.trim()) {
        const adicionales = this.nuevaEspecialidad
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s);
        seleccionadas.push(...adicionales);
      }

      if (seleccionadas.length === 0) {
        this.toast.show('Debe seleccionar al menos una especialidad.', 'error');
        return;
      }

      especialidadesFinal = seleccionadas;
    }

    this.loading = true;
    try {
      const { data: signUpData, error: signUpErr } = await this.auth.signUp(email, password);
      if (signUpErr) throw signUpErr;

      const userId = signUpData.user?.id ?? crypto.randomUUID();

      const fotoUrls: string[] = [];
      for (let i = 0; i < this.fotos.length; i++) {
        const url = await this.almacenamiento.subirImagen(
          this.fotos[i],
          perfil,
          userId,
          `foto${i + 1}.png`
        );
        if (url) fotoUrls.push(url);
      }

      const { error: usuarioErr } = await supabase.from('usuarios').insert({
        id: userId,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        edad,
        dni: dni.trim(),
        email: email.trim(),
        aprobado: perfil === 'especialista' ? false : true,
        perfil,
      });
      if (usuarioErr) throw usuarioErr;

      if (perfil === 'paciente') {
        await supabase.from('pacientes').insert({
          id: userId,
          obra_social: obra_social?.trim() ?? '',
          fotos_url: fotoUrls,
        });
      } else if (perfil === 'especialista') {
        await supabase.from('especialistas').insert({
          id: userId,
          especialidad: especialidadesFinal,
          foto_url: fotoUrls[0] ?? null,
        });
      }

      this.toast.show('Usuario creado correctamente.', 'success');
      this.volverAlInicio();
      this.cargarUsuarios();
    } catch (err: any) {
      console.error(err);
      this.toast.show(err?.message ?? 'Error al crear usuario.', 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async cerrarSesion() {
    try {
      await this.auth.signOut();
      this.toast.show('Sesión cerrada correctamente.', 'success');
      setTimeout(() => this.router.navigate(['/login']), 1200);
    } catch (err) {
      console.error(err);
      this.toast.show('Error al cerrar sesión.', 'error');
    }
  }
}
