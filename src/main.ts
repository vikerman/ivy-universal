// EVERYTHING HERE SHOULD BE AUTO-GENERATED.

import { patchAppendChildAndInsertBefore } from './lib/utils/patch-append-insert';
import { registerCustomElement } from './lib/elements/register-custom-element';
import { EventContract } from './lib/tsaction/event_contract';

import { ROUTES } from './routes';
import { RouteConfig } from './lib/router/router';

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
    /* webpackExclude: /\.module.ts$/ */
    /* webpackChunkName: "[request]-cmp" */
    `./components/${module}`
  );
}

function loadShell() {
  return import(
    /* webpackChunkName: "shell-root" */
    './shell/shell'
  );
}

function loadRouter() {
  return import(
    /* webpackChunkName: "router" */
    './lib/router/router'
  );
}

function loadPage(module: string) {
   if (module.endsWith('-page')) {
     module = module.substr(0, module.length - 5);
   }
   return import(
     /* webpackInclude: /\.ts$/ */
     /* webpackExclude: /\.spec.ts$/ */
     /* webpackExclude: /\.module.ts$/ */
     /* webpackChunkName: "[request]-page" */
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

    // The Shell is loaded from the shell folder. So using a different
    // loader function for that.
    let loader = loadElement;
    if (localName == 'shell-root') {
      loader = loadShell;
    } else if (localName.endsWith('-page')) {
      loader = loadPage;
    }

    registerCustomElement(customElements,
      () => import(
        /* webpackChunkName: "renderer" */
        './lib/elements/angular-ivy-bits'
      ),
      localName, componentType,
      undefined /* use default rehydration renderer */,
      undefined, /* default fetch fn */
      loader, contract);
  }
}

// TODO: How to generate this statically when property renaming is in effect?
const ELEMENTS_METADATA = [
  'shell-root', [],
  // PAGES
  'index-page', [],
  'about-page', [],
  // COMPONENTS
  'link-header', ['name', 'nameInternal'],
  'greeting-cmp', ['name', 'name'],
];

// Register custom elements which lazily loads the underlying component.
registerLazyCustomElements(ELEMENTS_METADATA);

// Lazily load the router when a route change happens or an anchor link with relative path was clicked.
let routerLoading = false;
function lazilyLoadRouter(loadRouter: () => Promise<any>,
    routes: RouteConfig[],
    contract: EventContract,
    forceInitialNavigation = false,
    onLoad?: (router: {navigate: (newPath?: string) => void}) => void) {
  if (!routerLoading) {
    routerLoading = true;
    loadRouter().then(router => {
      // Router takes over handling of route changes and router link clicks after it comes up.
      router.registerRouterElement(document, customElements, '', routes, contract,
        forceInitialNavigation, onLoad);
    });
  }
}

// Watch for anchor link clicks and history changes then load the full router to take over.
window.addEventListener('popstate', evt => {
  lazilyLoadRouter(loadRouter, ROUTES, contract, /* forceNavigation */ true);
});

contract.setRouterCallback(targetUrl => {
  lazilyLoadRouter(loadRouter, ROUTES, contract, /* forceNavigation */ false, router => {
    window.history.pushState(null, '', targetUrl);
    router.navigate(targetUrl);
  });
});
