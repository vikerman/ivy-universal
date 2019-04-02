import { Component, Input } from '@angular/core';

@Component({
  template: `
    <app-product-details [id]="id"></app-product-details>
  `,
})
export class Products_id {
  @Input()
  id = 0;
}
