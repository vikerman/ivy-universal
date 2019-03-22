import { Component } from '@angular/core';

@Component({
  selector: 'mui-appbar',
  template: `
    <div class="mui-appbar">
      <ng-content></ng-content>
    </div>
  `,
  // styleUrls: ['./mui-app-bar.scss'],
})
export class MuiAppbar { }
