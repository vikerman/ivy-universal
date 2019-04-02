import { NgModule } from '@angular/core';
import { Shipping } from './index';
import { CommonModule } from '@angular/common';

// Add only non-lazy references here.
@NgModule({
  declarations: [
    Shipping,
  ],
  imports: [CommonModule],
  exports: [Shipping],
})
export class ShippingModule { }
