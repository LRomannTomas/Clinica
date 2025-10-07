import { Routes } from '@angular/router';
import { authGuard } from './app/core/guards/auth-guard';
import { adminGuard } from './app/core/guards/admin-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./app/pages/bienvenida/bienvenida').then((m) => m.Bienvenida),
  },
  {
    path: 'login',
    loadComponent: () => import('./app/pages/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    loadComponent: () => import('./app/pages/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'home',
    loadComponent: () => import('./app/pages/home/home').then((m) => m.Home),
    canActivate: [authGuard],
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./app/pages/usuarios/usuarios').then((m) => m.Usuarios),
    canActivate: [authGuard, adminGuard],
  },
  { path: '**', redirectTo: '' },
];
