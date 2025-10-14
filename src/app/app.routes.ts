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
  {
    path: 'mis-turnos',
    loadComponent: () =>
      import('./app/pages/mis-turnos/mis-turnos').then((m) => m.MisTurnos),
    canActivate: [authGuard],
  },
  {
  path: 'mis-turnos-especialista',
  loadComponent: () =>
    import('./app/pages/mis-turnos-especialista/mis-turnos-especialista').then((m) => m.MisTurnosEspecialista),
  canActivate: [authGuard], 
  },
  {
  path: 'turnos-admin',
  canActivate: [authGuard,adminGuard],
  loadComponent: () => import('./app/pages/turnos-admin/turnos-admin').then(m => m.TurnosAdmin)
  },
  {
  path: 'solicitar-turno',
  canActivate: [authGuard],
  loadComponent: () => import('./app/pages/solicitar-turno/solicitar-turno').then(m => m.SolicitarTurno)
  },
  {
  path: 'mi-perfil',
  loadComponent: () => import('./app/pages/mi-perfil/mi-perfil').then(m => m.MiPerfil)
  },

  { path: '**', redirectTo: '' },
];
