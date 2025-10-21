import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { supabase } from '../../core/supabase/supabase.client';
import { Auth } from '../../core/servicios/auth';
import { Navbar } from '../../compartido/components/navbar/navbar';
import { Loading } from '../../compartido/components/loading/loading';
import { ToastService } from '../../core/servicios/toast';

type RolQuick = 'admin' | 'especialista' | 'paciente';

interface AccesoRapido {
  nombre: string;
  rol: RolQuick;
  img: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, Navbar, Loading],
})
export class Login implements OnInit {
  form!: FormGroup;
  loading = false;
  accesoSeleccionado: string | null = null;
  accesos: AccesoRapido[] = [];

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    const pacientes = Array.from({ length: 3 }, (_, i) => ({
      nombre: `Paciente ${i + 1}`,
      rol: 'paciente' as RolQuick,
      img: 'assets/images/paciente.png',
      email: `paciente${i + 1}@gmail.com`,
      password: 'paciente123',
    }));

    const especialistas = Array.from({ length: 2 }, (_, i) => ({
      nombre: `Especialista ${i + 1}`,
      rol: 'especialista' as RolQuick,
      img: 'assets/images/medico.png',
      email: `especialista${i + 1}@gmail.com`,
      password: 'especialista123',
    }));

    const admin = [
      {
        nombre: 'Admin',
        rol: 'admin' as RolQuick,
        img: 'assets/images/admin.png',
        email: 'admin@gmail.com',
        password: 'admin123',
      },
    ];

    this.accesos = [...pacientes, ...especialistas, ...admin];
  }
  async iniciarSesion() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toast.show('Complete correctamente los campos.', 'error');
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
        this.toast.show('Tu cuenta aún no fue aprobada por el administrador.', 'error');
        return;
      }

      switch (perfil.perfil) {
        case 'admin':
          this.router.navigate(['/usuarios']);
          break;

        case 'paciente':
          this.router.navigate(['/mis-turnos']);
          break;

        case 'especialista':
        default:
          this.router.navigate(['/mis-turnos-especialista']);
          break;
      }

      this.toast.show('Inicio de sesión exitoso. ¡Bienvenido!', 'success');
    } catch (err: any) {
      console.error(err);
      this.toast.show(err?.message || 'Error al iniciar sesión.', 'error');
    } finally {
      this.loading = false;
    }
  }

  accesoRapido(user: AccesoRapido) {
    this.form.patchValue({ email: user.email, password: user.password });
    this.accesoSeleccionado = user.nombre;
  }
}
