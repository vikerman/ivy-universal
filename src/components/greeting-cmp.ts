import { Component, Input, NgModule } from '@angular/core';
import { Counter } from '../services/counter';

@Component({
  template: `
  <h2>Hello {{name}}. Here are some links to help you start: </h2>
  {{counter.current()}}
  `,
})
export class Greeting {
  @Input()
  name: string;

  constructor(private readonly counter: Counter) {}
}

// Add only non-lazy references here.
@NgModule({
  declarations: [
    Greeting,
  ],
  exports: [Greeting],
})
export class GreetingModule { }
