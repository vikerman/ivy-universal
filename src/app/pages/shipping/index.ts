import { Component, Input } from '@angular/core';
import { InitialData } from '../../../lib/runtime';

@Component({
  template: `
  <h3>Shipping Prices</h3>

  <div class="shipping-item" *ngFor="let shipping of shippingCosts">
    <span>{{ shipping.type }} </span>
    <span>$ {{ shipping.price }}</span>
  </div>
  `,
})
export class Shipping {
  @InitialData(`/assets/shipping.json`)
  @Input()
  shippingCosts: Array<{type: string, price: number}>;
}
