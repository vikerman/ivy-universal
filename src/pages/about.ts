import { Component, NgModule } from '@angular/core';

@Component({
  template: `
    This is the About Page.
  `,
})
export class About {
}

// Add only non-lazy references here.
@NgModule({
  declarations: [
    About,
  ],
  exports: [About],
})
export class IndexModule { }
