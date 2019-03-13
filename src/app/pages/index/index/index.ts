import { Component } from '@angular/core';
import { navigate } from '../../../../lib/router/router';

@Component({
  template: `
    Child Route
    <button (click)="onClick()">Goto About</button>
  `,
})
export class IndexIndex {
  onClick() {
    navigate('/about');
  }
}
