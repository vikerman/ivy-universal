import { NgModule } from '@angular/core';
import { ProductAlerts } from './product-alerts';
import { CommonModule } from '@angular/common';

// Add only non-lazy references here. For lazy reference to other components
// just directly use them in the template with the '-cmp' suffix.
@NgModule({
  declarations: [
    ProductAlerts,
  ],
  exports: [ProductAlerts],
  imports: [CommonModule]
})
export class ProductAlertsModule {
}
