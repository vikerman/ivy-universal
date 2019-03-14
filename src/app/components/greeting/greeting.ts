import { Component, Input, Output, EventEmitter } from '@angular/core';

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
  update = new EventEmitter<void>();

  onClick() {
    this.update.emit();
  }

  constructor() {}
}
