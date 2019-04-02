import { NgModule } from '@angular/core';
import { Products_id } from './index';
import { CommonModule } from '@angular/common';

// Add only non-lazy references here.
@NgModule({
  declarations: [
    Products_id,
  ],
  imports: [CommonModule],
  exports: [Products_id],
})
export class Products_idModule { }
