import { Component, Input, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  template: `
    <h2 class="header">{{title}}</h2>
    <pages-root></pages-root>
  `,
})
export class ShellComponent {
  title = 'ivy';
}

// Add only non-lazy references here.
@NgModule({
  declarations: [
    ShellComponent,
  ],
  exports: [ShellComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ShellComponentModule { }
