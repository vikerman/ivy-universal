import { NgModule } from '@angular/core';
import { ProductDetails } from './product-details';
import { CommonModule } from '@angular/common';

// Add only non-lazy references here. For lazy reference to other components
// just directly use them in the template with the '-cmp' suffix.
@NgModule({
  declarations: [
    ProductDetails,
  ],
  exports: [ProductDetails],
  imports: [CommonModule]
})
export class ProductDetailsModule {
}
