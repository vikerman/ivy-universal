import { Component, Input, Output, OnInit } from '@angular/core';
import { PRODUCTS, Product } from '../../shared/products';
import { EventEmitterLite } from '../../../lib/rxjs-lite';

@Component({
  template: `
  <p *ngIf="product && product.price > 700">
    <button (click)="notify.emit()">Notify Me</button>
  </p>
  `,
})
export class ProductAlerts  implements OnInit {
  @Input() id: number;

  @Output() notify = new EventEmitterLite<void>();

  product: Product;

  ngOnInit(): void {
    this.product = PRODUCTS[this.id];
  }
}
