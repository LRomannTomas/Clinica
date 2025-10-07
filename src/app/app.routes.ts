import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./app/pages/bienvenida/bienvenida').then(m => m.Bienvenida)
  },
  {
    path: 'login',
    loadComponent: () => import('./app/pages/login/login').then(m => m.Login)
  },
  {
    path: 'registro',
    loadComponent: () => import('./app/pages/registro/registro').then(m => m.Registro)
  },
  { path: 'home', 
    loadComponent: () => import('./app/pages/home/home').then(m => m.Home)}, 
  {
    path: 'usuarios',
    loadComponent: () => import('./app/pages/usuarios/usuarios').then(m => m.Usuarios),
    canActivate: [
      () => import('./app/core/guards/auth-guard').then(m => m.authGuard),
      () => import('./app/core/guards/admin-guard').then(m => m.adminGuard)
    ]
  },
  { path: '**', redirectTo: '' }
];
