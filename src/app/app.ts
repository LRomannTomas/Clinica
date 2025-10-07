import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Toast } from './app/compartido/components/toast/toast';
import { ToastService } from './app/core/servicios/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, Toast],
  template: `
    <router-outlet></router-outlet>
    <app-toast [message]="toastMessage" [type]="toastType"></app-toast>
  `,
  styleUrl: './app.scss'
})
export class App {
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'info';

  constructor(private toastService: ToastService) {

    this.toastService.toast$.subscribe(toast => {
      if (toast) {
        this.toastMessage = toast.message;
        this.toastType = toast.type;
      } else {
        this.toastMessage = '';
      }
    });
  }
}
