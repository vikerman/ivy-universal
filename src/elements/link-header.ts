import { Component, Input, NgModule, CUSTOM_ELEMENTS_SCHEMA, ɵmarkDirty as markDirty } from '@angular/core';

import { NgIfModule } from '../lib/modules/ngif.module';
import { NgForModule } from '../lib/modules/ngfor.module';

@Component({
  selector: 'link-header',
  template: `
  <button (click)="onClick()">Press</button>
  <div *ngIf="nameInternal === 'ivy'">
    <div *ngFor="let s of strings">
      <h3 *ngIf="s.startsWith('I')">Hello</h3>{{s}}
    </div>
  </div>
  {{showGreeting}}
  <async-greeting *ngIf="showGreeting" [name]="nameInternal"></async-greeting>
  `,
})
export class LinkHeader {
  @Input('name')
  nameInternal: string;

  @Input()
  showGreeting = true;

  strings = ['Ivy', 'is', 'good'];
  count = 0;

  onClick() {
    this.strings.push('!!!');
    if (this.count++ > 2) {
      this.showGreeting = !this.showGreeting;
    }
  }
}

// Add only non-lazy references here. For lazy reference to other elements
// just directly use them in the template.
@NgModule({
  declarations: [
    LinkHeader,
  ],
  exports: [LinkHeader],
  imports: [NgIfModule, NgForModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LinkHeaderModule {}

// DO NOT EDIT BELOW THIS LINE
// This provides a stable export name without having to resort to default
// exports.  
export const ELEMENT = LinkHeader; 
