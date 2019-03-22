import { Component } from '@angular/core';

@Component({
  template: `
    <mui-appbar>
      <span>SHOP!</span>
    </mui-appbar>
    <pages-router></pages-router>
  `,
})
export class ShellComponent {
  title = 'ivy';
}
