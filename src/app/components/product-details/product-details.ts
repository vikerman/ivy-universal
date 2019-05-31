import { Component, Input, OnInit, Output } from '@angular/core';
import { InitialData } from '../../../lib/runtime';
import { EventEmitterLite } from '../../../lib/rxjs-lite';
import { Dispatch } from '../../../lib/store';

import { Product } from '../../shared/product';
import { ADD_TO_CART } from '../../state/actions/cart';

@Component({
  template: `
  <h2>Product Details</h2>

  <div *ngIf="product">
    <h3>{{ product.name }}</h3>
    <h4>$ {{ product.price }}</h4>
    <p>{{ product.description }}</p>
  </div> 
  <button (click)="addToCart()">Buy</button>
  `,
})
export class ProductDetails implements OnInit {
  @Input() id: number;

  @InitialData('/assets/products.json')
  @Input() products: Product[];

  @Dispatch(ADD_TO_CART)
  @Output() addProductToCart = new EventEmitterLite<Product>();

  product: Product;

  ngOnInit(): void {
    this.product = this.products[this.id];
  }

  addToCart() {
    window.alert('Your product has been added to the cart!');
    this.addProductToCart.emit(this.product);
  }
}
