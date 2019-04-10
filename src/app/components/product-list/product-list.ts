import { Component, Input } from '@angular/core';
import { Product, getProducts } from '../../shared/products';

@Component({
  template: `
  <h2>Products</h2>
  <div *ngFor="let product of products; index as productId">
    <h3>
      <a [title]="product.name + ' details'" [href]="'/products/' + productId">
        {{ product.name }}
      </a>
    </h3>

    <p *ngIf="product.description">
      Description: {{ product.description }}
    </p>
    
    <button (click)="share()">
      Share
    </button>
    
    <app-product-alerts [price]="product.price" (notify)="onNotify()">
    </app-product-alerts>
  </div>
  `,
})
export class ProductList {
  @Input()
  products: Product[];

  share() {
    window.alert('The product has been shared!');
  }

  onNotify() {
    window.alert('You will be notified when the product goes on sale');
  }

  // Initial data.
  static getInitialInputs = getProducts;
}
