import { Component, Input, ɵmarkDirty as markDirty } from '@angular/core';
import { Counter } from '../../services/counter';

@Component({
  selector: 'app-link-header',
  template: `
  <button (click)="onClick()">Press</button>
  <div *ngIf="name.startsWith('ivy')">
    <div *ngFor="let s of strings">
      <h3 *ngIf="s.startsWith('I')">Hello</h3>{{s}}
    </div>
  </div>
  <app-greeting [name]="name" (update)="onUpdate()"></app-greeting>
  `,
  styles: [
    `
    h3 {
      color: blue;
    }
    `
  ]
})
export class LinkHeader {
  @Input()
  name: string;

  // Constants are fine because their state is the same on initial render
  // on server and client. 
  strings = ['Ivy', 'is', 'good'];
  count = 0;

  constructor(private counter: Counter) {};

  onClick() {
    this.strings.push('Clicked!');
    if (++this.count > 2) {
      // After 2 clicks change the binding on the child component which causes
      // it to get fetched and rendered.
      this.name = `ivy${this.count}`;
    }
    // Tell Ivy that this component state has changed.
    markDirty(this);
  }

  onUpdate() {
    this.strings.push('Updated!');
    markDirty(this);
  }
}
