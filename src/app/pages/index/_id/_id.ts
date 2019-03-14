import { Component, Input, ɵmarkDirty as markDirty } from '@angular/core';

@Component({
  template: `
    <button (click)="onClick()">Press</button>
    <div *ngFor="let s of strings">{{s}}</div>
    <div> id : {{id}} </div>
    <div>
      {{getQueryParams()}}
    </div>
  `,
})
export class Index_Id {
  strings = [];

  onClick() {
    this.strings.push('New Line');
    // Tell Ivy that this component state has changed.
    markDirty(this);
  }

  @Input()
  id: string;

  @Input()
  queryParams: {};

  getQueryParams() {
    return Object.keys(this.queryParams).map(
      p => (JSON.stringify({key: p, value: this.queryParams[p]})));
  }
}
