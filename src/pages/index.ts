import { Component, NgModule } from '@angular/core';

@Component({
  template: `
    <link-header name="ivy"></link-header>
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
