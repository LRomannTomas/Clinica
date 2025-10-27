import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dni',
  standalone: true,
})
export class DniPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (!value) return '—';
    const digits = String(value).replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}
