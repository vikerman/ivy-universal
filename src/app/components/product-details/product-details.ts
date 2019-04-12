import { Component, Input, OnInit } from '@angular/core';
import { Product } from '../../shared/products';
import { InitialData } from '../../../lib/runtime';

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

  product: Product;

  ngOnInit(): void {
    this.product = this.products[this.id];
  }

  addToCart() {
    window.alert('Your product has been added to the cart!');
    // this.cartService.addToCart(this.product);
  }
}
