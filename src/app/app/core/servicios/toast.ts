import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastState = new BehaviorSubject<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  toast$ = this.toastState.asObservable();

  show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastState.next({ message, type });

    setTimeout(() => this.toastState.next(null), 4000);
  }
}
