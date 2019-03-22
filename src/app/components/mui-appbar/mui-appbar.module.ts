import { NgModule } from '@angular/core';
import { MuiAppbar } from './mui-appbar';
import { CommonModule } from '@angular/common';

// Add only non-lazy references here. For lazy reference to other components
// just directly use them in the template with the '-cmp' suffix.
@NgModule({
  declarations: [
    MuiAppbar,
  ],
  exports: [MuiAppbar],
  imports: [CommonModule]
})
export class MuiAppBarModule {}
