import { Component, Input, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { NgIfModule } from '../lib/modules/ngif.module';
import { NgForModule } from '../lib/modules/ngfor.module';

@Component({
  selector: 'link-header',
  template: `
  <button (click)="onClick()">Press</button>
  <div *ngIf="name === 'ivy'">
    <div *ngFor="let s of strings">
      <h3 *ngIf="s.startsWith('I')">Hello</h3>{{s}}
    </div>
  </div>
  <h2>Hello {{name}}. Here are some links to help you start: </h2>
  `,
})
export class LinkHeader {
  @Input()
  name: string;

  strings = ['Ivy', 'is', 'good'];

  onClick() {
    alert('cliked!');
  }
}

@NgModule({
  declarations: [
    LinkHeader,
  ],
  imports: [NgIfModule, NgForModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LinkHeaderModule {}
