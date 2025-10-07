import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { supabase } from '../../core/supabase/supabase.client';
import { Auth } from '../../core/servicios/auth';
import { Navbar } from '../../compartido/components/navbar/navbar';
import { Loading } from '../../compartido/components/loading/loading';
import { Toast } from '../../compartido/components/toast/toast';

type RolQuick = 'admin' | 'especialista' | 'paciente';

const DEMO_CREDENTIALS: Record<RolQuick, { email: string; password: string }> = {
  admin: { email: 'admin@gmail.com', password: 'admin123' },
  especialista: { email: 'especialista@gmail.com', password: 'especialista123' },
  paciente: { email: 'paciente@gmail.com', password: 'paciente123' },
};

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, Navbar, Loading, Toast],
})
export class Login implements OnInit {
  form!: FormGroup;
  loading = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'info';

  rolSeleccionado: RolQuick | null = null; 

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  mostrarToast(msg: string, type: 'success' | 'error' | 'info') {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  async iniciarSesion() {
  this.form.markAllAsTouched();
  if (this.form.invalid) {
    this.mostrarToast('Complete correctamente los campos.', 'error');
    return;
  }

  this.loading = true;
  const { email, password } = this.form.value;

  try {
    const { data, error } = await this.auth.signIn(email, password);
    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error('No se pudo obtener el usuario.');

    const { data: perfil, error: perfilErr } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    if (perfilErr) throw perfilErr;
    if (!perfil) throw new Error('Perfil no encontrado.');

    if (perfil.perfil === 'especialista' && !perfil.aprobado) {
      this.mostrarToast(
        'Tu cuenta aún no fue aprobada por el administrador.',
        'error'
      );
      return;
    }

    if (perfil.perfil === 'admin') {
      this.router.navigate(['/usuarios']);
    } else {
      this.router.navigate(['/home']);
    }

    this.mostrarToast('Inicio de sesión exitoso. ¡Bienvenido!', 'success');
  } catch (err: any) {
    console.error(err);
    this.mostrarToast(err?.message || 'Error al iniciar sesión.', 'error');
  } finally {
    this.loading = false;
    this.cdr.detectChanges();
  }
}


  // ------------------------------------------------------------
  // ACCESOS RAPIDOS
  // ------------------------------------------------------------
  accesoRapido(rol: RolQuick) {
    const creds = DEMO_CREDENTIALS[rol];
    if (!creds) {
      this.mostrarToast('No hay credenciales configuradas para este acceso rápido.', 'error');
      return;
    }

    this.form.patchValue({ email: creds.email, password: creds.password });
    this.rolSeleccionado = rol; 
  }
}
