import { NgModule } from '@angular/core';
import { Cart } from './index';

// Add only non-lazy references here.
@NgModule({
  declarations: [
    Cart,
  ],
  exports: [Cart],
})
export class CartModule { }
