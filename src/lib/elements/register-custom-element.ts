import { ɵComponentType as ComponentType, Injector } from '@angular/core';
import { RendererFactory3 } from '@angular/core/src/render3/interfaces/renderer';

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
    rendererFactory?: RendererFactory3,
    moduleLoader?: (module: string) => Promise<any>,
    contract?: EventContract) {
 
  let strategyFactory: NgElementStrategyFactory;
  if (typeof component === 'function') {
    // A direct componentType was provided. Initialize that immediately.
    strategyFactory = new LazyIvyElementStrategyFactory(doc, ngBitsLoader,
      component as any, rendererFactory, moduleLoader, contract);
  } else {
    // Create a custom element that lazily loads its backing component either
    // on user event or input change.
    strategyFactory = new LazyIvyElementStrategyFactory(doc, ngBitsLoader,
      tag, rendererFactory, moduleLoader, contract);
  }

  ceRegistry.define(tag, createCustomElement(component, {strategyFactory}));
}
