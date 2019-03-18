import { ɵComponentType as ComponentType } from '@angular/core';

import { createCustomElement } from './create-custom-element';
import { LazyIvyElementStrategyFactory } from './ivy-strategy-factory';
import { NgElementStrategyFactory } from './element-strategy';
import { EventContract } from '../tsaction/event_contract';

export function registerCustomElement<T>(
    doc: Document,
    ceRegistry: CustomElementRegistry,
    ngBitsLoader: () => any | Promise<any>,
    tag: string,
    component: ComponentType<T>,
    // TODO: Type to RendererFactory3 once it's exposed publicly
    rendererFactory?: any,
    moduleLoader?: (module: string) => Promise<any>,
    contract?: EventContract) {
 
  let strategyFactory: NgElementStrategyFactory;
  if (typeof component === 'function') {
    // A direct componentType was provided. Initialize that immediately.
    strategyFactory = new LazyIvyElementStrategyFactory(doc, ngBitsLoader,
      component, rendererFactory, moduleLoader, contract);
  } else {
    // Create a custom element that lazily loads its backing component either
    // on user event or input change.
    strategyFactory = new LazyIvyElementStrategyFactory(doc, ngBitsLoader,
      tag, rendererFactory, moduleLoader, contract);
  }

  ceRegistry.define(tag, createCustomElement(component, {strategyFactory}));
}
