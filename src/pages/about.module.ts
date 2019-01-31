import { NgModule } from '@angular/core';
import { About } from './about';

// Add only non-lazy references here.
@NgModule({
  declarations: [
    About,
  ],
  exports: [About],
})
export class IndexModule { }
