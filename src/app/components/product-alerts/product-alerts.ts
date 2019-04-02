import { Component, Input, Output } from '@angular/core';
import { EventEmitterLite } from '../../../lib/rxjs-lite';

@Component({
  template: `
  <p *ngIf="product.price > 700">
    <button (click)="notify.emit()">Notify Me</button>
  </p>
  `,
})
export class ProductAlerts {
  @Input() product: {price: number};

  @Output() notify = new EventEmitterLite();
}
