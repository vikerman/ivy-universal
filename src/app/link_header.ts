import { Component, Input } from '@angular/core';

@Component({
  selector: 'link-header',
  template: `
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
}
