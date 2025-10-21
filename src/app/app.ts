import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Toast } from './app/compartido/components/toast/toast';
import { ToastService } from './app/core/servicios/toast';
import { fadeSlideAnimation } from './app/compartido/animations/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, Toast],
  template: `
    <main [@fadeSlideAnimation]="getRouterOutletState(outlet)" class="router-wrapper">
      <router-outlet #outlet="outlet"></router-outlet>
    </main>
    <app-toast [message]="toastMessage" [type]="toastType"></app-toast>
  `,
  styleUrl: './app.scss',
  animations: [fadeSlideAnimation],
})


export class App {
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'info';

  constructor(private toastService: ToastService) {
    this.toastService.toast$.subscribe((toast) => {
      if (toast) {
        this.toastMessage = toast.message;
        this.toastType = toast.type;
      } else {
        this.toastMessage = '';
      }
    });
  }

  getRouterOutletState(outlet: any) {
    return outlet.isActivated ? outlet.activatedRoute : '';
  }
}
