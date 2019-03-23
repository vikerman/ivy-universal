import { Component, Input, Output } from '@angular/core';

import { EventEmitterLite } from '../../../lib/rxjs-lite';

@Component({
  selector: 'app-greeting',
  template: `
  <h3>Hello {{name}}!</h3>
  <button (click)='onClick()'>Update</button>
  <pages-router></pages-router>
  `,
  styles: [
    `h3 { color: green; }`
  ]
})
export class Greeting {
  @Input()
  name: string;

  @Output()
  updated = new EventEmitterLite<void>();

  @Output()
  update = new EventEmitterLite<void>();

  onClick() {
    this.update.emit();
    this.updated.emit();
  }

  constructor() {}
}
