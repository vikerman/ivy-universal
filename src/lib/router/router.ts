import { isNode } from '../utils/utils';

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
    routes: RouteConfig[]) {
  class RouterElement extends HTMLElement {
    connectedCallback() {
      if (isNode()) {
        // Just load the first route in the config as the child for now.
        const name = routes[0].component;
        const el = doc.createElement(name);
        this.insertAdjacentElement('afterbegin', el);
      }
    }
  }

  ceRegistry.define('pages-root', RouterElement);
}
