import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../core/servicios/auth';
import { Toast } from '../../compartido/components/toast/toast';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Toast],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home {
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private auth: Auth, private router: Router) {}

  async cerrarSesion() {
    try {
      await this.auth.signOut();
      this.toastMessage = 'Sesión cerrada correctamente.';
      this.toastType = 'success';
      setTimeout(() => {
        this.toastMessage = '';
        this.router.navigate(['/login']);
      }, 2000);
    } catch (error) {
      console.error(error);
      this.toastMessage = 'Error al cerrar sesión.';
      this.toastType = 'error';
    }
  }
}
