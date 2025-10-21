import { trigger, transition, style, animate, query, group } from '@angular/animations';

export const fadeSlideAnimation = trigger('fadeSlideAnimation', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        width: '100%',
        opacity: 0,
        transform: 'translateY(20px)'
      }),
    ], { optional: true }),

    group([
      query(':leave', [
        animate('250ms ease', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ], { optional: true }),

      query(':enter', [
        animate('350ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ], { optional: true })
    ])
  ])
]);

export const zoomInOut = trigger('zoomInOut', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.9)' }),
    animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
  ]),
  transition(':leave', [
    animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' })),
  ]),
]);

