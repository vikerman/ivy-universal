import { NgModule } from '@angular/core';
import { Greeting } from './greeting-cmp';

// Add only non-lazy references here.
@NgModule({
  declarations: [
    Greeting,
  ],
  exports: [Greeting],
})
export class GreetingModule { }
