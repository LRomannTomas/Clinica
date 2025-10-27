import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nombreCompleto',
  standalone: true,
})
export class NombreCompletoPipe implements PipeTransform {
  transform(value: any): string {
    if (!value) return '';
    const nombre = value?.nombre ?? '';
    const apellido = value?.apellido ?? '';
    const full = `${nombre} ${apellido}`.trim();
    return full
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
}
