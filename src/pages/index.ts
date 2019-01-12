import { Component, NgModule } from '@angular/core';

@Component({
  template: `
    <link-header-cmp name="ivy"></link-header-cmp>
  `,
})
export class Index {
}

// Add only non-lazy references here.
@NgModule({
  declarations: [
    Index,
  ],
  exports: [Index],
})
export class IndexModule { }
