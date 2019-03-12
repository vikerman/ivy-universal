import { Component } from '@angular/core';

@Component({
  template: `
    Child Route
    <button (click)="onClick()">Press</button>
  `,
})
export class IndexIndex {
  onClick() {
    console.log('Clicked child route button');
  }
}
