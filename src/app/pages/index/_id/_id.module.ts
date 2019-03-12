import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Index_Id } from './_id';

// Add only non-lazy references here.
@NgModule({
  declarations: [
    Index_Id,
  ],
  imports: [CommonModule],
  exports: [Index_Id],
})
export class Index_IdModule { }
