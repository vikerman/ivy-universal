import { Component, Input, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

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
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GreetingModule { }
