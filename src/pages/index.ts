import { Component, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

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
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class IndexModule { }
