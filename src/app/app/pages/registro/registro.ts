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
import { Toast } from '../../compartido/components/toast/toast';

@Component({
  selector: 'app-registro',
  standalone: true,
  templateUrl: './registro.html',
  styleUrls: ['./registro.scss'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Navbar, ImageUploader, Loading, Toast],
})
export class Registro implements OnInit {
  tipo: 'paciente' | 'especialista' = 'paciente';
  loading = false;
  fotos: File[] = [];
  especialidades: string[] = ['Cardiología', 'Pediatría', 'Dermatología', 'Neurología'];
  mostrarOtraEspecialidad = false;
  nuevaEspecialidad: string = '';
  imagenError = '';

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  formPaciente!: FormGroup;
  formEspecialista!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private almacenamiento: Almacenamiento,
    private cdr: ChangeDetectorRef
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
      especialidad: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onFotosSeleccionadas(files: File[]) {
    this.fotos = files;
  }

  onEspecialidadChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.mostrarOtraEspecialidad = value === 'otra';
    if (this.mostrarOtraEspecialidad) {
      this.nuevaEspecialidad = '';
    }
  }

  // --------------------------------------------------------------------
  // PACIENTE
  // --------------------------------------------------------------------
  async registrarPaciente() {
    this.formPaciente.markAllAsTouched();
    if (this.formPaciente.invalid || this.fotos.length !== 2) {
      this.mostrarToast('Complete todos los campos y suba 2 imágenes.', 'error');
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

      const { error: usuarioErr } = await supabase.from('usuarios').insert({
        id: userId,
        nombre: this.formPaciente.get('nombre')?.value.trim(),
        apellido: this.formPaciente.get('apellido')?.value.trim(),
        edad: this.formPaciente.get('edad')?.value,
        dni: this.formPaciente.get('dni')?.value.trim(),
        email,
        aprobado: true,
        perfil: 'paciente'
      });
      if (usuarioErr) throw usuarioErr;

      const { error: pacienteErr } = await supabase.from('pacientes').insert({
        id: userId,
        obra_social: this.formPaciente.get('obra_social')?.value.trim(),
        fotos_url: fotoUrls
      });
      if (pacienteErr) throw pacienteErr;

      if (!signUpData.session) {
        this.mostrarToast('Te enviamos un mail para verificar tu cuenta. Confirmalo para completar el registro.', 'success');
      } else {
        this.mostrarToast('Paciente registrado correctamente.', 'success');
      }

      this.formPaciente.reset();
      this.fotos = [];
    } catch (err: any) {
      console.error(err);
      this.mostrarToast(err?.message ?? 'Error al registrar paciente.', 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // --------------------------------------------------------------------
  // ESPECIALISTA
  // --------------------------------------------------------------------
  async registrarEspecialista() {
    this.formEspecialista.markAllAsTouched();
    if (this.formEspecialista.invalid || this.fotos.length !== 1) {
      this.mostrarToast('Complete todos los campos y suba una imagen.', 'error');
      return;
    }

    this.loading = true;
    try {
      const email = this.formEspecialista.get('email')?.value.trim();
      const password = this.formEspecialista.get('password')?.value;
      const especialidadFinal = this.mostrarOtraEspecialidad
        ? this.nuevaEspecialidad
        : this.formEspecialista.get('especialidad')?.value;

      const { data: signUpData, error: signUpErr } = await this.auth.signUp(email, password);
      if (signUpErr) throw signUpErr;

      const userId = signUpData.user?.id ?? crypto.randomUUID();

      const fotoUrl = await this.almacenamiento.subirImagen(this.fotos[0], 'especialista', userId, 'perfil.png');

      const { error: usuarioErr } = await supabase.from('usuarios').insert({
        id: userId,
        nombre: this.formEspecialista.get('nombre')?.value.trim(),
        apellido: this.formEspecialista.get('apellido')?.value.trim(),
        edad: this.formEspecialista.get('edad')?.value,
        dni: this.formEspecialista.get('dni')?.value.trim(),
        email,
        aprobado: false,
        perfil: 'especialista'
      });
      if (usuarioErr) throw usuarioErr;

      const { error: especialistaErr } = await supabase.from('especialistas').insert({
        id: userId,
        especialidad: especialidadFinal,
        foto_url: fotoUrl
      });
      if (especialistaErr) throw especialistaErr;

      if (!signUpData.session) {
        this.mostrarToast('Te enviamos un mail para verificar tu cuenta. Luego un administrador aprobará tu registro.', 'success');
      } else {
        this.mostrarToast('Especialista registrado correctamente. Esperando aprobación.', 'success');
      }

      this.formEspecialista.reset();
      this.fotos = [];
    } catch (err: any) {
      console.error(err);
      this.mostrarToast(err?.message ?? 'Error al registrar especialista.', 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // --------------------------------------------------------------------
  // TOAST
  // --------------------------------------------------------------------
  mostrarToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toastMessage = mensaje;
    this.toastType = tipo;
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 4000);
    this.cdr.detectChanges();
  }
}
