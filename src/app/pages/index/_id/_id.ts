import { Component, Input } from '@angular/core';

@Component({
  template: `
    <button (click)="onClick()">Press</button>
    <div> id : {{id}} </div>
    <div *ngFor="let item of queryParams | keyvalue">
      {{item.key}}:{{item.value}}
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
}
