import { Component, Input, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'greeting',
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

// DO NOT EDIT BELOW THIS LINE
// This provides a stable export name without having to resort to default
// exports.  
export const ELEMENT = Greeting; 
