import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { supabase } from '../../core/supabase/supabase.client';
import { Loading } from '../../compartido/components/loading/loading';
import { Toast } from '../../compartido/components/toast/toast';
import { Auth } from '../../core/servicios/auth';
import { Almacenamiento } from '../../core/servicios/almacenamiento';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.scss'],
  imports: [CommonModule, ReactiveFormsModule, Loading, Toast],
})
export class Usuarios implements OnInit {
  usuarios: any[] = [];
  loading = false;
  mensaje = '';

  form!: FormGroup;
  fotos: File[] = [];
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private auth: Auth,
    private almacenamiento: Almacenamiento,
    private router: Router
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: [null, [Validators.required, Validators.min(1)]],
      dni: ['', [Validators.required, Validators.minLength(7)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      perfil: ['admin', Validators.required], 
      especialidad: [''],
      obra_social: [''], 
    });

    this.cargarUsuarios();
  }

  mostrarToast(msg: string, tipo: 'success' | 'error' = 'success') {
    this.toastMessage = msg;
    this.toastType = tipo;
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 4000);
    this.cdr.detectChanges();
  }

  async cargarUsuarios() {
    this.loading = true;
    this.mensaje = '';
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('perfil', { ascending: true });

      if (error) throw error;
      this.usuarios = data || [];
      if (this.usuarios.length === 0) this.mensaje = 'No hay usuarios registrados.';
    } catch (err) {
      console.error(err);
      this.mensaje = 'Error al cargar los usuarios.';
    } finally {
      this.loading = false;
    }
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
      this.mostrarToast(
        `Especialista ${nuevoEstado ? 'habilitado' : 'inhabilitado'} correctamente.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      this.mostrarToast('No se pudo actualizar el estado del usuario.', 'error');
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

      const { error } = await supabase.from('usuarios').delete().eq('id', usuario.id);
      if (error) throw error;

      this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
      this.mostrarToast('Usuario eliminado correctamente.', 'success');
    } catch (err) {
      console.error(err);
      this.mostrarToast('Error al eliminar usuario.', 'error');
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
      this.mostrarToast('Complete correctamente los campos requeridos.', 'error');
      return;
    }

    const { nombre, apellido, edad, dni, email, password, perfil, especialidad, obra_social } =
      this.form.value;


    if (perfil === 'paciente' && this.fotos.length !== 2) {
      this.mostrarToast('El paciente debe tener 2 imágenes.', 'error');
      return;
    }
    if (perfil === 'especialista' && this.fotos.length !== 1) {
      this.mostrarToast('El especialista debe tener una imagen.', 'error');
      return;
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
        const { error } = await supabase.from('pacientes').insert({
          id: userId,
          obra_social: obra_social?.trim() ?? '',
          fotos_url: fotoUrls,
        });
        if (error) throw error;
      } else if (perfil === 'especialista') {
        const { error } = await supabase.from('especialistas').insert({
          id: userId,
          especialidad: especialidad?.trim() ?? '',
          foto_url: fotoUrls[0] ?? null,
        });
        if (error) throw error;
      }

      this.mostrarToast('Usuario creado correctamente.', 'success');
      this.form.reset({ perfil: 'admin' });
      this.fotos = [];
      this.cargarUsuarios();
    } catch (err: any) {
      console.error(err);
      this.mostrarToast(err?.message ?? 'Error al crear usuario.', 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async cerrarSesion() {
    try {
      await this.auth.signOut();
      this.mostrarToast('Sesión cerrada correctamente.', 'success');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1200);
    } catch (err) {
      console.error(err);
      this.mostrarToast('Error al cerrar sesión.', 'error');
    }
  }

}
