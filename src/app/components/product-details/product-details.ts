import { Component, Input } from '@angular/core';
import { PRODUCTS, Product } from '../../shared/products';

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
export class ProductDetails {
  @Input() id: number;

  product: Product;

  ngOnInit() {
    this.product = PRODUCTS[this.id];
  }

  addToCart() {
    window.alert('Your product has been added to the cart!');
    // this.cartService.addToCart(this.product);
  }
}
