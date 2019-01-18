import { Component, Input, NgModule, ɵmarkDirty as markDirty } from '@angular/core';

import { NgIfModule } from '../lib/modules/ngif.module';
import { NgForModule } from '../lib/modules/ngfor.module';
import { Counter } from '../services/counter';

@Component({
  template: `
  <button (click)="onClick()">Press</button>
  <div *ngIf="nameInternal.startsWith('ivy')">
    <div *ngFor="let s of strings">
      <h3 *ngIf="s.startsWith('I')">Hello</h3>{{s}}
    </div>
  </div>
  <greeting-cmp [name]="nameInternal"></greeting-cmp>
  `,
})
export class LinkHeader {
  @Input('name')
  nameInternal: string;

  strings = ['Ivy', 'is', 'good'];

  constructor(private readonly counter: Counter) {}

  onClick() {
    this.strings.push('!!!');
    this.counter.increment();
    if (this.counter.current() > 2) {
      // After 2 clicks change the binding on the child component which causes
      // it to get fetched and rendered.
      this.nameInternal = `ivy${this.counter.current()}`;
    }
    // Tell Ivy that this component state has changed.
    markDirty(this);
  }
}

// Add only non-lazy references here. For lazy reference to other components
// just directly use them in the template with the '-cmp' suffix.
@NgModule({
  declarations: [
    LinkHeader,
  ],
  exports: [LinkHeader],
  imports: [NgIfModule, NgForModule],
})
export class LinkHeaderModule {}
