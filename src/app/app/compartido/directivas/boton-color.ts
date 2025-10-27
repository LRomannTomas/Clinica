import { Directive, ElementRef, Input, OnChanges, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appBotonColor]',
  standalone: true,
})
export class BotonColorDirective implements OnChanges {
  @Input('appBotonColor') tipo: 'ver' | 'motivo' | 'reseña' | 'cancelar' | 'default' = 'default';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges() {
    const colorMap: Record<string, { bg: string; text: string }> = {
      ver: { bg: '#2a9d8f', text: '#fff' },
      motivo: { bg: '#e9c46a', text: '#000' },
      reseña: { bg: '#457b9d', text: '#fff' },
      cancelar: { bg: '#e76f51', text: '#fff' },
      default: { bg: '#ccc', text: '#000' },
    };

    const { bg, text } = colorMap[this.tipo] || colorMap['default'];

    this.renderer.setStyle(this.el.nativeElement, 'background-color', bg);
    this.renderer.setStyle(this.el.nativeElement, 'color', text);
    this.renderer.setStyle(this.el.nativeElement, 'border', 'none');
    this.renderer.setStyle(this.el.nativeElement, 'border-radius', '8px');
    this.renderer.setStyle(this.el.nativeElement, 'padding', '8px 14px');
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'pointer');
    this.renderer.setStyle(this.el.nativeElement, 'transition', '0.3s');
    this.renderer.setStyle(this.el.nativeElement, 'font-weight', '600');

    this.renderer.listen(this.el.nativeElement, 'mouseenter', () => {
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '0.85');
    });
    this.renderer.listen(this.el.nativeElement, 'mouseleave', () => {
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
    });
  }
}
