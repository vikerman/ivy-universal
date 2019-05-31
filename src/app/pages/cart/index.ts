import { Component, Input } from '@angular/core';
import { State } from '../../../lib/store';
import { CartState } from '../../state/store/cart';

@Component({
  template: `
  <h3>Cart</h3>

  <p>
    <a href="/shipping">Shipping Prices</a>
  </p>

  div class="cart-item" *ngFor="let item of cart.items">
    <span>{{ item.name }} </span>
    <span>{{ item.price | currency }}</span>
  </div>
  `,
})
export class Cart {
  @State('cart')
  @Input() cart: CartState;
}
