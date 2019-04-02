import { Component, Input, Output, OnInit } from '@angular/core';
import { EventEmitterLite } from '../../../lib/rxjs-lite';
import { PRODUCTS } from '../../shared/products';

@Component({
  template: `
  <p *ngIf="product && product.price > 700">
    <button (click)="notify.emit()">Notify Me</button>
  </p>
  `,
})
export class ProductAlerts  implements OnInit {
  @Input() id: number;

  @Output() notify = new EventEmitterLite();

  product: typeof PRODUCTS[0];

  ngOnInit(): void {
    this.product = PRODUCTS[this.id];
  }
}
