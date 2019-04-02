import { Component, Input } from '@angular/core';
import { PartialInputs, fetchInitialData } from '../../../lib/runtime';

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
  @Input()
  shippingCosts: Array<{type: string, price: number}>;

  static async getInitialInputs(context: PartialInputs<Shipping>)
  {
    const data = await fetchInitialData(context, `/assets/shipping.json`);
    return {shippingCosts: JSON.parse(data)};
  }
}
