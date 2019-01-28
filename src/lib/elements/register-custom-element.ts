import { ɵComponentType as ComponentType, Injector } from '@angular/core';
import { RendererFactory3 } from '@angular/core/src/render3/interfaces/renderer';

import { createCustomElement } from './create-custom-element';
import { LazyIvyElementStrategyFactory } from './ivy-strategy-factory';
import { NgElementStrategyFactory } from './element-strategy';
import { EventContract } from '../tsaction/event_contract';

export function registerCustomElement<T>(
    ceRegistry: CustomElementRegistry,
    ngBitsLoader: () => any | Promise<any>,
    tag: string,
    component: ComponentType<T>,
    rendererFactory?: RendererFactory3,
    fetchFn?: (url: string) => Promise<string>,
    moduleLoader?: (module: string) => Promise<any>,
    contract?: EventContract) {
 
  if (fetchFn == null) {
    fetchFn = async (url: string) => {return (await window.fetch(url)).text()};
  }
  let strategyFactory: NgElementStrategyFactory;
  if (typeof component === 'function') {
    // A direct componentType was provided. Initialize that immediately.
    strategyFactory = new LazyIvyElementStrategyFactory(ngBitsLoader,
      component as any, rendererFactory, fetchFn, moduleLoader, contract);
  } else {
    // Create a custom element that lazily loads its backing component either
    // on user event or input change.
    strategyFactory = new LazyIvyElementStrategyFactory(ngBitsLoader,
      tag, rendererFactory, fetchFn, moduleLoader, contract);
  }

  ceRegistry.define(tag, createCustomElement(component, {strategyFactory}));
}
