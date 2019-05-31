import { Component, Input, Output } from '@angular/core';
import { Product } from '../../shared/product';
import { EventEmitterLite } from '../../../lib/rxjs-lite';

@Component({
  template: `
  <p *ngIf="price > 700">
    <button (click)="notify.emit()">Notify Me</button>
  </p>
  `,
})
export class ProductAlerts  {
  @Input() price: number;

  @Output() notify = new EventEmitterLite<void>();

  product: Product;
}
