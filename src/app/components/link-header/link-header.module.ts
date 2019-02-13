import { NgModule } from '@angular/core';
import { LinkHeader } from './link-header';
import { CommonModule } from '@angular/common';

// Add only non-lazy references here. For lazy reference to other components
// just directly use them in the template with the '-cmp' suffix.
@NgModule({
  declarations: [
    LinkHeader,
  ],
  exports: [LinkHeader],
  imports: [CommonModule]
})
export class LinkHeaderModule {}
