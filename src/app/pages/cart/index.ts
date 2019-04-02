import { Component } from '@angular/core';

@Component({
  template: `
  <h3>Cart</h3>

  <p>
    <a href="/shipping">Shipping Prices</a>
  </p>

  <!--div class="cart-item" *ngFor="let item of items">
    <span>{{ item.name }} </span>
    <span>{{ item.price | currency }}</span>
  </div-->
  `,
})
export class Cart {
}
