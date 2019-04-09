import { Component, Input, Output, OnInit } from '@angular/core';
import { PRODUCTS, Product } from '../../shared/products';

@Component({
  template: `
  <p *ngIf="product && product.price > 700">
    <button (click)="notify.emit()">Notify Me</button>
  </p>
  `,
})
export class ProductAlerts  implements OnInit {
  @Input() id: number;

  product: Product;

  ngOnInit(): void {
    this.product = PRODUCTS[this.id];
  }
}
