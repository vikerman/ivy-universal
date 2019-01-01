import { AppComponent } from './app/app.component';

import { ɵrenderComponent as renderComponent } from '@angular/core';
import { patchAppendChildAndInsertBefore, RehydrationRendererFactory } from './lib/rehydration/rehydration_renderer';
import { registerCustomElement } from './lib/elements/register-custom-element';

// Patch appendChild and insertBefore so that when an existing rehydrated
// node is appended to it's parent - Just ignore the operation.
// In the future instead of patching we should have a way to signal to Ivy that
// a node is rehydrated and it shouldn't try to append/insert it.
patchAppendChildAndInsertBefore();
// renderComponent(AppComponent, {rendererFactory: RehydrationRendererFactory});

// Webpack provides a concise way([request]) to define named chunks without 
// making this section big and letting us to use predictable names while
// dynamically lazy loading chunks. While this section is concise there still
// must be a single table somewhere to lookup the chunk names. Need to make sure
// that can scale well for 100s of components without bloating
// runtime.js/main.js.
function loadModule(module: string) {
  return import(
    /* webpackChunkName: "[request]" */
    `./elements/${module}`
  );
}

/**
 * Parse the Ivy Element metadata and load shell Custom Elements
 * on the client that lazily bootstrap the actual component.
 */
function registerCustomElements(elementsMetadata: any[]) {
  for (let i = 0; i < elementsMetadata.length - 2;) {
    const localName: string = elementsMetadata[i++];
    const inputsArray: string[] = elementsMetadata[i++];
    const ssr: boolean = elementsMetadata[i++];

    const inputs = {};
    for (let j = 0; j < inputsArray.length - 1;) {
      const propName = inputsArray[j++];
      const templateName = inputsArray[j++];
      inputs[propName] = templateName;
    }

    const componentType = {} as any;
    componentType.ngComponentDef = {
      inputs
    };

    registerCustomElement(customElements, localName, componentType,
      RehydrationRendererFactory, loadModule);
  }
}

// EVERYTHING BELOW HERE WILL BE AUTO-GENERATED.
const ELEMENTS_METADATA = [
  'e-link-header', ['name', 'nameInternal'], true
];

registerCustomElements(ELEMENTS_METADATA);

// The following block lets us define named chunks in webpack but should
// get optimized out in prod mode. So adding 100s of components here shoudln't
// increase main.js bundle size. This will be auto-generated.
if (false) {
  loadModule('link-header');
}
