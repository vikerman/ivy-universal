import { Component, Input, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LinkHeaderModule {}
