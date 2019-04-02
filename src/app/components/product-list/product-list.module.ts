import { NgModule } from '@angular/core';
import { ProductList } from './product-list';
import { CommonModule } from '@angular/common';

// Add only non-lazy references here. For lazy reference to other components
// just directly use them in the template with the '-cmp' suffix.
@NgModule({
  declarations: [
    ProductList,
  ],
  exports: [ProductList],
  imports: [CommonModule]
})
export class ProductListModule {}
