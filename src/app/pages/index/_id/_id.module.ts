import { NgModule } from '@angular/core';

import { Index_Id } from './_id';
import { CommonModule } from '@angular/common';

// Add only non-lazy references here.
@NgModule({
  declarations: [
    Index_Id,
  ],
  imports: [CommonModule],
  exports: [Index_Id],
})
export class Index_IdModule { }
