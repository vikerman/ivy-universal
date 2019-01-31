import { NgModule } from '@angular/core';
import { ShellComponent } from './shell';

// Add only non-lazy references here.
@NgModule({
  declarations: [
    ShellComponent,
  ],
  exports: [ShellComponent],
})
export class ShellComponentModule { }
