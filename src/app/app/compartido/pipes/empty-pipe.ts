import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'empty',
  standalone: true,
})
export class EmptyPipe implements PipeTransform {
  transform(value: any, fallback: string = '—', suffix: string = ''): string {
    const isEmpty =
      value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
    return isEmpty ? fallback : `${value}${suffix}`;
  }
}
