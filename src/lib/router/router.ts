import { EventContract } from '../tsaction/event_contract';
import { Route } from '../ivy-route-recognizer/route-recognizer/dsl';

// TODO : needs some major refactoring.

const ROUTER_LOCAL_NAME = 'pages-router';

function getCurrentLocation() {
  return window.location.pathname + window.location.search;
}

function loadRouterModule() {
  return import('../router-impl/router');
}

// Lazily load the router when a route change happens or an anchor link with relative path was clicked.
let routerLoaded = false;
let navigateFn: (targetUrl: string) => Promise<any> = null;

function lazilyLoadRouter(loadRouter: () => Promise<any>,
    routes: (Route | Route[])[],
    contract: EventContract,
    onLoad?: (router: {navigate: (newPath?: string) => void, depth: number}) => void) {
  if (!routerLoaded) {
    return loadRouter().then(routerModule => {
      // Router takes over handling of route changes and router link clicks after it comes up.
      routerModule.registerRouterElement(document, customElements, '', routes, contract, router => {
        // Take over the imperative loader to directly navigate using the loaded router.
        if (router.depth === 1) {
          navigateFn = (targetUrl: string) => {
            if (getCurrentLocation() !== targetUrl) {
              window.history.pushState(null, '', targetUrl);
              router.navigate(targetUrl);
            }
            // TODO: Wait for actual route resolution.
            return Promise.resolve(true);
          }
        }
        if (onLoad != null) {
          onLoad(router);
        }
      });
      routerLoaded = true;
      // TODO : Return Promise to actual route resolution and not just loading code.
    });
  }
}

export function initRouter(ROUTES: (Route | Route[])[], contract: EventContract) {

  if (document.querySelector(ROUTER_LOCAL_NAME) == null) {
    // No routers found. Just exit.
    return;
  }

  // Watch for history state changes then load the full router to take over.
  window.addEventListener('popstate', evt => {
    lazilyLoadRouter(loadRouterModule, ROUTES, contract, router => router.navigate());
  });

  // Set the function for imperative navigation.
  navigateFn = (targetUrl) => {
    if (getCurrentLocation() !== targetUrl) {
      window.history.pushState(null, '', targetUrl);

      return lazilyLoadRouter(loadRouterModule, ROUTES, contract, router => {
        if (router.depth == 1) {
          router.navigate(targetUrl);
        } else {
          router.navigate();
        }
      });
    }
  };

  // Watch for anchor link clicks.
  contract.setRouterCallback(navigateFn);
}

export function navigate(path: string) {
  if (navigateFn != null) {
    return navigateFn(path);
  }
  return Promise.reject('No router was found in page.');
}
