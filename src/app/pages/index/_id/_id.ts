import { Component, Input, ɵmarkDirty as markDirty } from '@angular/core';
import { fetchInitialData, PartialInputs } from '../../../../lib/runtime';

declare interface SomeData {
  name: string;
  price: number;
}

@Component({
  template: `
    <button (click)="onClick()">Press</button>
    <div *ngFor="let s of strings">{{s}}</div>
    <div> id : {{id}} </div>
    <div>
      {{getQueryParams()}}
    </div>
    <div *ngIf="data">
      <div>Name: {{data.name}}</div>
      <div>Price: {{data.price}}</div>
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
  id: string = '';

  @Input()
  queryParams: {} = {};

  @Input()
  data?: SomeData;

  getQueryParams() {
    return Object.keys(this.queryParams).map(
      p => (JSON.stringify({key: p, value: this.queryParams[p]})));
  }

  static async getInitialInputs(context: PartialInputs<Index_Id>): Promise<PartialInputs<Index_Id>>
  {
    const idNum = parseInt(context.id);
    if (context.id == null || isNaN(idNum)) {
      throw new Error(`Missing or malformed 'id': ${context.id}`);
    }

    const data = await fetchInitialData(context, `/assets/item${idNum}.json`);
    return {data: JSON.parse(data)};
  }
}
