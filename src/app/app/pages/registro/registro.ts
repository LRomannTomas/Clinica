import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../core/servicios/auth';
import { Almacenamiento } from '../../core/servicios/almacenamiento';
import { supabase } from '../../core/supabase/supabase.client';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../compartido/components/navbar/navbar';
import { ImageUploader } from '../../compartido/components/image-uploader/image-uploader';
import { Loading } from '../../compartido/components/loading/loading';
import { ToastService } from '../../core/servicios/toast';

@Component({
  selector: 'app-registro',
  standalone: true,
  templateUrl: './registro.html',
  styleUrls: ['./registro.scss'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Navbar, ImageUploader, Loading],
})
export class Registro implements OnInit {
  tipoSeleccionado: 'paciente' | 'especialista' | null = null;
  pasoEspecialista: 1 | 2 = 1;
  loading = false;
  fotos: File[] = [];

  especialidades = [
    { nombre: 'Cardiología', archivo: 'cardiologia.png' },
    { nombre: 'Dermatología', archivo: 'dermatologia.png' },
    { nombre: 'Neurología', archivo: 'neurologia.png' },
  ];
  especialidadesSeleccionadas: string[] = [];
  mostrarOtraEspecialidad = false;
  nuevaEspecialidad = '';
  formPaciente!: FormGroup;
  formEspecialista!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private almacenamiento: Almacenamiento,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.formPaciente = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: [null, [Validators.required, Validators.min(1)]],
      dni: ['', [Validators.required, Validators.minLength(7)]],
      obra_social: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.formEspecialista = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: [null, [Validators.required, Validators.min(1)]],
      dni: ['', [Validators.required, Validators.minLength(7)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  seleccionarTipo(tipo: 'paciente' | 'especialista') {
    this.tipoSeleccionado = tipo;
  }

  volver() {
    this.tipoSeleccionado = null;
    this.formPaciente.reset();
    this.formEspecialista.reset();
    this.fotos = [];
    this.especialidadesSeleccionadas = [];
    this.pasoEspecialista = 1;
  }

  onFotosSeleccionadas(files: File[]) {
    this.fotos = files;
  }

  continuarEspecialista() {
    this.formEspecialista.markAllAsTouched();
    if (this.formEspecialista.invalid || this.fotos.length !== 1) {
      this.toast.show('Complete todos los campos y suba una imagen.', 'error');
      return;
    }
    this.pasoEspecialista = 2;
  }

  toggleEspecialidad(nombre: string) {
    const index = this.especialidadesSeleccionadas.indexOf(nombre);
    if (index >= 0) {
      this.especialidadesSeleccionadas.splice(index, 1);
    } else {
      this.especialidadesSeleccionadas.push(nombre);
    }
  }

  toggleOtra() {
    this.mostrarOtraEspecialidad = !this.mostrarOtraEspecialidad;
    if (!this.mostrarOtraEspecialidad) this.nuevaEspecialidad = '';
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

  async registrarEspecialista() {
    if (
      this.especialidadesSeleccionadas.length === 0 &&
      (!this.mostrarOtraEspecialidad || !this.nuevaEspecialidad.trim())
    ) {
      this.toast.show('Seleccione al menos una especialidad.', 'error');
      return;
    }

    this.loading = true;
    try {
      const email = this.formEspecialista.get('email')?.value.trim();
      const password = this.formEspecialista.get('password')?.value;
      const { data: signUpData, error: signUpErr } = await this.auth.signUp(email, password);
      if (signUpErr) throw signUpErr;

      const userId = signUpData.user?.id ?? crypto.randomUUID();
      const fotoUrl = await this.almacenamiento.subirImagen(this.fotos[0], 'especialista', userId, 'perfil.png');


      let otrasEspecialidades: string[] = [];

      if (this.mostrarOtraEspecialidad && this.nuevaEspecialidad.trim()) {
        
        otrasEspecialidades = this.nuevaEspecialidad
          .split(/[,;]+/)
          .map((esp) => esp.trim())
          .filter((esp) => esp.length > 0);
      }

      const especialidadesFinal: string[] = [
        ...this.especialidadesSeleccionadas,
        ...otrasEspecialidades,
      ];


      const { error: usuarioErr } = await supabase.from('usuarios').insert({
        id: userId,
        nombre: this.formEspecialista.get('nombre')?.value.trim(),
        apellido: this.formEspecialista.get('apellido')?.value.trim(),
        edad: this.formEspecialista.get('edad')?.value,
        dni: this.formEspecialista.get('dni')?.value.trim(),
        email,
        aprobado: false,
        perfil: 'especialista',
      });
      if (usuarioErr) throw usuarioErr;

      const { error: especialistaErr } = await supabase.from('especialistas').insert({
        id: userId,
        especialidad: especialidadesFinal, 
        foto_url: fotoUrl,
      });
      if (especialistaErr) throw especialistaErr;

      this.toast.show('Registro enviado. Esperando aprobación del administrador.', 'success');
      this.volver();
    } catch (err: any) {
      console.error(err);
      this.toast.show(err?.message ?? 'Error al registrar especialista.', 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async registrarPaciente() {
    this.formPaciente.markAllAsTouched();
    if (this.formPaciente.invalid || this.fotos.length !== 2) {
      this.toast.show('Complete todos los campos y suba 2 imágenes.', 'error');
      return;
    }

    this.loading = true;
    try {
      const email = this.formPaciente.get('email')?.value.trim();
      const password = this.formPaciente.get('password')?.value;
      const { data: signUpData, error: signUpErr } = await this.auth.signUp(email, password);
      if (signUpErr) throw signUpErr;

      const userId = signUpData.user?.id ?? crypto.randomUUID();
      const fotoUrls: string[] = [];
      for (let i = 0; i < this.fotos.length; i++) {
        const url = await this.almacenamiento.subirImagen(this.fotos[i], 'paciente', userId, `foto${i + 1}.png`);
        if (url) fotoUrls.push(url);
      }

      await supabase.from('usuarios').insert({
        id: userId,
        nombre: this.formPaciente.get('nombre')?.value.trim(),
        apellido: this.formPaciente.get('apellido')?.value.trim(),
        edad: this.formPaciente.get('edad')?.value,
        dni: this.formPaciente.get('dni')?.value.trim(),
        email,
        aprobado: true,
        perfil: 'paciente',
      });

      await supabase.from('pacientes').insert({
        id: userId,
        obra_social: this.formPaciente.get('obra_social')?.value.trim(),
        fotos_url: fotoUrls,
      });

      this.toast.show('Paciente registrado correctamente.', 'success');
      this.volver();
    } catch (err: any) {
      console.error(err);
      this.toast.show(err?.message ?? 'Error al registrar paciente.', 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
