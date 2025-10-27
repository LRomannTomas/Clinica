import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appOnlyNumber]',
  standalone: true,
})
export class OnlyNumberDirective {
  @Input() allowDecimal = false;

  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
    if (allowedKeys.includes(e.key)) return;

    const isNumber = /^\d$/.test(e.key);
    const isDecimal = this.allowDecimal && (e.key === '.' || e.key === ',');
    if (!isNumber && !isDecimal) e.preventDefault();
  }

  @HostListener('input', ['$event'])
  onInput(e: Event) {
    const el = e.target as HTMLInputElement;
    const regex = this.allowDecimal ? /[^0-9.,]/g : /[^0-9]/g;
    el.value = el.value.replace(regex, '');
  }
}
