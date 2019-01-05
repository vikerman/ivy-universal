import { Component, Input, NgModule, CUSTOM_ELEMENTS_SCHEMA, ɵmarkDirty as markDirty } from '@angular/core';

import { NgIfModule } from '../lib/modules/ngif.module';
import { NgForModule } from '../lib/modules/ngfor.module';

@Component({
  selector: 'link-header',
  template: `
  <button (click)="onClick()">Press</button>
  <div *ngIf="nameInternal.startsWith('ivy')">
    <div *ngFor="let s of strings">
      <h3 *ngIf="s.startsWith('I')">Hello</h3>{{s}}
    </div>
  </div>
  <async-greeting [name]="nameInternal"></async-greeting>
  `,
})
export class LinkHeader {
  @Input('name')
  nameInternal: string;

  strings = ['Ivy', 'is', 'good'];
  count = 0;

  onClick() {
    this.strings.push('!!!');
    if (++this.count > 2) {
      // After 2 clicks change the binding on the child component that should
      // lazy load the child element code and re-render.
      this.nameInternal = `ivy${this.count}`;
    }
    // Tell Ivy that this component state has changed to reevaluate templates.
    markDirty(this);
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
