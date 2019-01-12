import { Component, Input, NgModule } from '@angular/core';

@Component({
  template: `
  <h2>Hello {{name}}. Here are some links to help you start: </h2>
  `,
})
export class Greeting {
  @Input()
  name: string;
}

// Add only non-lazy references here.
@NgModule({
  declarations: [
    Greeting,
  ],
  exports: [Greeting],
})
export class GreetingModule { }
