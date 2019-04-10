import { Component, Input, OnInit } from '@angular/core';
import { Product, getProducts } from '../../shared/products';

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

  // Resolved input
  @Input() products: Product[];

  product: Product;

  ngOnInit(): void {
    this.product = this.products[this.id];
  }

  // Initial data.
  static getInitialInputs = getProducts;

  addToCart() {
    window.alert('Your product has been added to the cart!');
    // this.cartService.addToCart(this.product);
  }
}
