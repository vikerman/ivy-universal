import { NgModule } from '@angular/core';
import { Posts } from './posts';

// Add only non-lazy references here.
@NgModule({
  declarations: [
    Posts,
  ],
  exports: [Posts],
})
export class IndexModule { }
