import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.html',
  styleUrls: ['./toast.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' })),
      ]),
    ]),
  ],
  imports: [CommonModule],
})
export class Toast implements OnChanges {
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'info' = 'info';
  visible = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['message'] && this.message) {
      this.mostrar();
    }
  }

  mostrar() {
    this.visible = true;
    setTimeout(() => (this.visible = false), 4000);
  }
}
