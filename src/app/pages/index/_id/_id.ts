import { Component, Input } from '@angular/core';

@Component({
  template: `
    <button (click)="onClick()">Press</button>
    <div> id : {{id}} </div>
    <div>
      {{getQueryParams()}}
    </div>
  `,
})
export class Index_Id {
  onClick() {
    console.log('Hydrated...');
  }

  @Input()
  id: string;

  @Input()
  queryParams: {};

  getQueryParams() {
    return Object.keys(this.queryParams).map(p => (JSON.stringify({key: p, value: this.queryParams[p]})));
  }
}
