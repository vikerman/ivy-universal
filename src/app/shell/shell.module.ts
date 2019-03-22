import { NgModule } from '@angular/core';
import { ShellComponent } from './shell';
import { MuiAppBarModule } from '../components/mui-appbar/mui-appbar.module';

// Add only non-lazy references here.
@NgModule({
  declarations: [
    ShellComponent,
  ],
  exports: [ShellComponent],
  imports: [MuiAppBarModule]
})
export class ShellComponentModule { }
