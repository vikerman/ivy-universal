import { NgModule } from '@angular/core';
import { LinkHeader } from './link-header';
import { NgIfModule } from '../lib/modules/ngif.module';
import { NgForModule } from '../lib/modules/ngfor.module';

// Add only non-lazy references here. For lazy reference to other components
// just directly use them in the template with the '-cmp' suffix.
@NgModule({
  declarations: [
    LinkHeader,
  ],
  exports: [LinkHeader],
  imports: [NgIfModule, NgForModule],
})
export class LinkHeaderModule {}
