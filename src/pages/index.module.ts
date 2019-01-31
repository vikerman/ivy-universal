import { NgModule } from '@angular/core';
import { Index } from './index';

// Add only non-lazy references here.
@NgModule({
  declarations: [
    Index,
  ],
  exports: [Index],
})
export class IndexModule { }
