import { isNode } from '../utils/utils';
import { EventContract } from '../tsaction/event_contract';

export interface RouteConfig {
  path: string,
  component: string;
}

/**
 * A lightweight custom element based router for loading 'pages'.
 */
export function registerRouterElement(
    doc: Document, // Not global on the server
    ceRegistry: CustomElementRegistry, // Not global on the server
    initialPath: string,
    routes: RouteConfig[],
    eventContract?: EventContract,
    forceInitialNavigation = false,
    onLoad?: (router: {navigate: (newPath?: string) => void}) => void) {
  class RouterElement extends HTMLElement {

    // Maintain currently matching page component to avoid rerendering the
    // same component if there is no actual change.
    currentPageComponent = '';

    private normalizePath(path: string) {
      const queryIndex = path.indexOf('?');
      path = path.substr(0, queryIndex);
      if (path.endsWith('/')) {
        path = path.substr(0, path.length - 1);
      }
      return path;
    }

    private getMatchingRoute(path: string) {
      // Ignore the query parameter and normalize path.
      path = this.normalizePath(path);

      // TODO: If nothing matches, go to the 404 page.
      return routes.find(route => route.path === path) || routes[0];
    }

    public navigate(newPath?: string) {
      // Match the current path to the route config.
      const path = newPath || window.location.pathname;

      const matchedRoute = this.getMatchingRoute(path);

      if (matchedRoute.component === this.currentPageComponent) {
        // TODO: Match component as well as parameters.
        return;
      }

      this.currentPageComponent = matchedRoute.component;

      // Delete all child nodes if any.
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }

      const el = doc.createElement(matchedRoute.component);
      this.insertAdjacentElement('afterbegin', el);
    }

    private routerCallback(url: string) {
      const origPath = window.location.pathname;
      window.history.pushState({}, '', url);
      if (origPath !== window.location.pathname) {
        this.navigate();
      }
    }

    connectedCallback() {
      if (isNode()) {
        // Server : Instantiate the page component.
        this.navigate(initialPath);
      } else {
        // Client: Listen for popstate and router link clicks.
        window.addEventListener('popstate', _evt => {
          this.navigate();
        });

        // Router link clicks come from the event contract are handled here
        eventContract!.setRouterCallback(this.routerCallback.bind(this));

        // Initialize current page component.
        if (forceInitialNavigation) {
          // Flag has been set to force the current navigation on boot up.
          // Will forcibly remove children and add the component for current route.
          this.navigate();
        } else {
          this.currentPageComponent = this.getMatchingRoute(window.location.pathname).component;
        }
      }
      if (onLoad) {
        onLoad(this);
      }
    }
  }

  ceRegistry.define('pages-root', RouterElement);
}
