import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true,
})
export class AutoFocusDirective implements AfterViewInit {
  @Input() focusDelay = 50;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.el.nativeElement.focus?.();
    }, this.focusDelay);
  }
}
