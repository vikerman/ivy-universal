import { Component, NgModule } from '@angular/core';

@Component({
  template: `
    <h2 class="header">{{title}}</h2>
    <div class="navbar">
      <a class="navlink" href='/'>Home</a>
      <a class="navlink" href='/about'>About</a>
    </div>
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
