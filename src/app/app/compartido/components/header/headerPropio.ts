import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../../core/servicios/auth';
import { ToastService } from '../../../core/servicios/toast';
import { CommonModule } from '@angular/common';
import { supabase } from '../../../core/supabase/supabase.client';

@Component({
  selector: 'app-HeaderPropio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './headerPropio.html',
  styleUrls: ['./headerPropio.scss']
})
export class HeaderPropio implements OnInit {
  perfil: string | null = null;

  constructor(
    private auth: Auth,
    private router: Router,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('perfil')
      .eq('id', user.id)
      .single();

    this.perfil = usuario?.perfil ?? null;
  }

  navegar(ruta: string) {
    this.router.navigate([ruta]);
  }

  esRutaActiva(ruta: string): boolean {
    return this.router.url === ruta;
  }

  async cerrarSesion() {
    try {
      await this.auth.signOut();
      this.toast.show('Sesión cerrada correctamente.', 'success');
      setTimeout(() => this.router.navigate(['/login']), 1200);
    } catch {
      this.toast.show('Error al cerrar sesión.', 'error');
    }
  }
}
