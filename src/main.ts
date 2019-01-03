// EVERYTHING HERE SHOULD BE AUTO-GENERATED.

import { patchAppendChildAndInsertBefore, RehydrationRendererFactory } from './lib/rehydration/rehydration_renderer';
import { registerCustomElement } from './lib/elements/register-custom-element';
import { EventContract } from './lib/tsaction/event_contract';

// TODO : Move this even earlier so that chances of missing DOM events are
// zero/low.
const contract = new EventContract(document.documentElement,[
  'click',
]);
contract.listen();

// Patch appendChild and insertBefore so that when an existing rehydrated
// node is appended to it's parent - Just ignore the operation.
// In the future instead of patching we should have a way to signal to Ivy that
// a node is rehydrated and it shouldn't try to append/insert it.
patchAppendChildAndInsertBefore();

// Webpack provides a concise way([request]) to define named chunks without 
// making this section big and letting us to use predictable names while
// dynamically lazy loading chunks. While this section is concise there still
// must be a single table somewhere to lookup the chunk names. Need to make sure
// that can scale well for 100s of components without bloating
// runtime.js/main.js.
function loadElement(module: string) {
  return import(
    /* webpackInclude: /\.ts$/ */
    /* webpackExclude: /\.spec.ts$/ */
    /* webpackChunkName: "e-[request]" */
    `./elements/${module}`
  );
}

function loadPage(module: string) {
  return import(
    /* webpackInclude: /\.ts$/ */
    /* webpackExclude: /\.spec.ts$/ */
    /* webpackChunkName: "page-[request]" */
    `./pages/${module}`
  );
}

/**
 * Parse the Ivy Element metadata and load shell Custom Elements
 * on the client that lazily bootstrap the actual component.
 */
function registerLazyCustomElements(elementsMetadata: any[]) {
  for (let i = 0; i < elementsMetadata.length - 1;) {
    const localName: string = elementsMetadata[i++];
    const inputsArray: string[] = elementsMetadata[i++];

    const inputs = {};
    for (let j = 0; j < inputsArray.length - 1;) {
      const propName = inputsArray[j++];
      const templateName = inputsArray[j++];
      inputs[propName] = templateName;
    }

    // Create a dummy ComponentType with only the `inputs` metadata.
    const componentType = {} as any;
    componentType.ngComponentDef = {inputs};

    registerCustomElement(customElements, localName, componentType,
      RehydrationRendererFactory, loadElement, contract);
  }
}

// TODO: How to generate this statically when property renaming is in effect?
const ELEMENTS_METADATA = [
  'e-link-header', ['name', 'nameInternal'],
  'e-greeting', ['name', 'name'],
];

// Load the shell custom elements whih lazily loads the underlying component.
registerLazyCustomElements(ELEMENTS_METADATA);
