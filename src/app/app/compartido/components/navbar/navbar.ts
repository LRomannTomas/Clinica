import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '../../../core/servicios/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class Navbar {
  @Input() isLoggedIn = false;
  @Input() role: string | null = null;

  constructor(private auth: Auth) {}

  async logout() {
    await this.auth.signOut();
    location.href = '/';
  }
}
