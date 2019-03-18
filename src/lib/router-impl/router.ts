import RouteRecognizer from '../ivy-route-recognizer/route-recognizer';
import { Route } from '../ivy-route-recognizer/route-recognizer/dsl';

import { isNode } from '../utils/utils';
import { EventContract } from '../tsaction/event_contract';

const ROUTER_LOCAL_NAME = 'pages-router';

function getCurrentLocation() {
  return window.location.pathname + window.location.search;
}

/**
 * A lightweight custom element based router for loading 'pages'.
 */
export function registerRouterElement(
    doc: Document, // Not global on the server
    ceRegistry: CustomElementRegistry, // Not global on the server
    initialPath: string,
    routes: (Route | Route[])[],
    eventContract?: EventContract,
    onLoad?: (router: {navigate: (newPath?: string) => void}) => void) {
  class RouterElement extends HTMLElement {

    private recognizer: RouteRecognizer;

    // Maintain currently matching page component adn element to avoid 
    // rerendering the same component if there is no change to the component
    // (but maybe only the params or queryParams).
    private currentPageComponent = '';
    private childElement: Element;
    private parentRouter: Element | null = null;

    // Nested router depth
    private depth = 0;

    private getMatchedRoute(path: string) {
      const match = this.recognizer.recognize(path);
      if (match == null || match.length < this.depth) {
        return {
          queryParams: {},
          match: {
            handler: 'code-404',
            params: {},
            isDynamic: false,
          }
        }
      }
      return {
        queryParams: match.queryParams,
        match: match[this.depth - 1],
      }
    }

    private initRouteRecognizer() {
      if (this.recognizer == null) {
        this.recognizer = new RouteRecognizer();
        for (const route of routes) {
          if (route instanceof Array) {
            this.recognizer.add(route);
          } else {
            this.recognizer.add([route]);
          }
        }
      }
    }

    private initRouter() {
      this.childElement = this.firstElementChild;

      // Figure out depth of this router.
      for (let el = this as HTMLElement; el != null; el = el.parentElement) {
        if (el.localName === ROUTER_LOCAL_NAME) {
          if (this.depth == 1) {
            this.parentRouter = el;
            el['childRouter'] = this;
          }
          this.depth++;
        }
      }

      this.initRouteRecognizer();
    }

    public navigate(newPath?: string) {
      // Match the current path to the route config.
      const path = newPath || getCurrentLocation();

      const matchedRoute = this.getMatchedRoute(path);
      this.currentPageComponent = matchedRoute.match.handler as string;

      // TODO: If the page component is same across routes - re-resolve initial
      // inputs and run change detection instead of removing and adding the
      // component?

      // Delete all child nodes if any.
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }

      // Insert new child element.
      this.childElement = doc.createElement(this.currentPageComponent);
      this.insertAdjacentElement('afterbegin', this.childElement);

      // Set the params on the component.
      for (const param of Object.keys(matchedRoute.match.params)) {
        this.childElement[param] = matchedRoute.match.params[param];
      }
      this.childElement['queryParams'] = matchedRoute.queryParams;

      // Chain to child router's navigate.
      if (this['childRouter'] != null) {
        this['childRouter'].navigate(newPath);
      }
    }

    private routerCallback(url: string) {
      if (url !== getCurrentLocation()) {
        window.history.pushState({}, '', url);
        this.navigate();
      }
    }

    connectedCallback() {
      this.initRouter();

      if (isNode()) {
        // Server : Instantiate the page component.
        this.navigate(initialPath);
      } else {
        // Client: Listen for popstate and router link clicks.
        window.addEventListener('popstate', _evt => {
          this.navigate();
        });

        // Router link clicks come from the event contract are handled here
        if (this.depth == 1) {
          eventContract!.setRouterCallback(this.routerCallback.bind(this));
        }
      }
      if (onLoad) {
        onLoad(this);
      }
    }

    disconnectedCallback() {
      if (this.parentRouter != null) {
        this.parentRouter['childRouter'] = null;
      }
    }
  }

  ceRegistry.define(ROUTER_LOCAL_NAME, RouterElement);
}
