import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-greeting',
  template: `
  <h2>Hello {{name}}!!!!</h2>
  `,
})
export class Greeting {
  @Input()
  name: string;

  constructor() {}
}
