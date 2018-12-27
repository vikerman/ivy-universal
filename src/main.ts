import { AppComponent } from './app/app.component';

import { ɵrenderComponent as renderComponent} from '@angular/core';
import { patchAppendChildAndInsertBefore, RehydrationRendererFactory } from './lib/rehydration/rehydration_renderer';
import { bootstrapCustomElement } from './lib/elements/bootstrap';

// Patch appendChild and insertBefore so that when an existing rehydrated
// node is appended to it's parent - Just ignore the operation.
// In the future instead of patching we should have a way to signal to Ivy that
// a node is rehydrated and it shouldn't try to append/insert it.
patchAppendChildAndInsertBefore();
renderComponent(AppComponent, {rendererFactory: RehydrationRendererFactory});

import('./elements/link-header').then(module => {
  bootstrapCustomElement(customElements, 'link-header', module.LinkHeader, RehydrationRendererFactory);
});
