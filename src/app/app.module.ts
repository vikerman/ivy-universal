
import { NgModule, ViewContainerRef, TemplateRef} from '@angular/core';
import { directiveInject, defineDirective } from '@angular/core/src/render3/index';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { LinkHeader } from './link_header';

@NgModule({
  declarations: [
    AppComponent,
    LinkHeader,
  ],
  imports: [CommonModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
