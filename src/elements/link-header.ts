import { Component, Input, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { NgIfModule } from '../lib/modules/ngif.module';
import { NgForModule } from '../lib/modules/ngfor.module';

@Component({
  selector: 'link-header', // Should match filename.
  template: `
  <button (click)="onClick()">Press</button>
  <div *ngIf="nameInternal === 'ivy'">
    <div *ngFor="let s of strings">
      <h3 *ngIf="s.startsWith('I')">Hello</h3>{{s}}
    </div>
  </div>
  <h2>Hello {{nameInternal}}. Here are some links to help you start: </h2>
  `,
})
class LinkHeader {
  @Input('name')
  nameInternal: string;

  strings = ['Ivy', 'is', 'good'];

  onClick() {
    alert('cliked!');
  }
}

// Add only non-lazy references here. For lazy reference to other elements
// just 
@NgModule({
  declarations: [
    LinkHeader,
  ],
  imports: [NgIfModule, NgForModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LinkHeaderModule {}

// DO NOT EDIT BELOW THIS LINE
// This provides a stable export name without having to resort to default
// exports.  
export const ELEMENT = LinkHeader; 
