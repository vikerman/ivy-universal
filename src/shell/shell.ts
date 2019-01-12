import { Component, NgModule } from '@angular/core';

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
})
export class ShellComponentModule { }
