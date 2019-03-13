// EVERYTHING HERE SHOULD BE AUTO-GENERATED.
import { patchAppendChildAndInsertBefore } from './lib/utils/patch-append-insert';
import { registerCustomElement } from './lib/elements/register-custom-element';
import { EventContract } from './lib/tsaction/event_contract';
import { initRouter } from './lib/router/router';

import { ROUTES } from './routes';

// TODO : Move this even earlier so that chances of missing DOM events are
// zero/low.
const contract = new EventContract(document.documentElement, [
  'click',
]);
contract.listen();

// Patch appendChild and insertBefore so that when an existing rehydrated
// node is appended to it's parent - Just ignore the operation.
// In the future instead of patching we should have a way to signal to Ivy that
// a node is rehydrated and it shouldn't try to append/insert it.
patchAppendChildAndInsertBefore();

function loadElement(module: string) {
  let name = '';
  if (module.startsWith('app-')) {
    name = module.substr(4);
  }
  switch (name) {
    case 'link-header':
      return import('./app/components/link-header/link-header');
    case 'greeting':
      return import('./app/components/greeting/greeting');
    default:
      throw new Error(`Unknown component module ${module}`);
  }
}

function loadShell() {
  return import('./app/shell/shell');
}

function loadPage(module: string) {
  let name ='';
   if (module.startsWith('page-')) {
     name = module.substr(5);
   }
   switch (name) {
    case 'index':
      return import('./app/pages/index/index');
    case 'index-index':
      return import('./app/pages/index/index/index');
    case 'index_id':
      return import('./app/pages/index/_id/_id');  
    case 'about':
      return import('./app/pages/about/about');
    default:
      throw new Error(`Unknown page module ${module}`);
  }
}

// Initialize seen component map and id for CSS encapsulation.
function initializeSeenElements() {
  const scriptEl = document.getElementById('_elements');
  const elements = JSON.parse(scriptEl.textContent);
  (document as any)._seenElements = new Map();
  (document as any)._nextCompId = Object.keys(elements).length;
  for (const element of Object.keys(elements)) {
    (document as any)._seenElements.set(element, elements[element]);
  }
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

    // The Shell is loaded from the shell folder. So using a different
    // loader function for that.
    let loader: (module: string) => Promise<any> = loadElement;
    if (localName == 'shell-root') {
      loader = loadShell;
    } else if (localName.startsWith('page-')) {
      loader = loadPage;
    }

    registerCustomElement(
      document,
      customElements,
      () => import(
        /* webpackChunkName: "renderer" */
        './lib/elements/angular-ivy-bits'
      ),
      localName, componentType,
      undefined /* use default rehydration renderer */, loader, contract);
  }
}

// TODO : Remove need for internal property name here.
const ELEMENTS_METADATA = [
  'shell-root', [],
  // PAGES
  'page-index', [],
  'page-index-index', [],
  'page-index_id', ['id', 'id', 'queryParams', 'queryParams'],
  'page-about', [],
  // COMPONENTS
  'app-link-header', ['name', 'name'],
  'app-greeting', ['name', 'name'],
];

// Initialize the seenElements list to setup CSS scoping properly and match
// the scope Ids set on the server.
initializeSeenElements();

// Register custom elements which lazily loads the underlying component.
registerLazyCustomElements(ELEMENTS_METADATA);

initRouter(ROUTES, contract);
