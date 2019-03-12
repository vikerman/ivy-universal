import { NgModule } from '@angular/core';
import { IndexIndex } from './index';

// Add only non-lazy references here.
@NgModule({
  declarations: [
    IndexIndex,
  ],
  exports: [IndexIndex],
})
export class IndexModule { }
