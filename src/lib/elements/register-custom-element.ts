import { ɵComponentType as ComponentType } from '@angular/core';
import { RendererFactory3 } from '@angular/core/src/render3/interfaces/renderer';

import { createCustomElement } from './create-custom-element';
import { IvyNgElementStrategyFactory } from './ivy-strategy-factory';
import { NgElementStrategyFactory } from './element-strategy';
import { EventContract } from '../tsaction/event_contract';

function createInjector() {
  return {
    get() {
      return {
        resolveComponentFactory: (component: ComponentType<any>) => {
          const inputs = Object.keys(component.ngComponentDef['inputs']).map(input => {
            return {
              propName: input,
              templateName: component.ngComponentDef['inputs'][input]
            };
          });
          return { inputs };
        }
      };
    }
  }
}

export function registerCustomElement<T>(
    ceRegistry: CustomElementRegistry,
    tag: string,
    component: ComponentType<T>,
    rendererFactory?: RendererFactory3,
    moduleLoader?: (module: string) => Promise<any>,
    contract?: EventContract) {
 
  let strategyFactory: NgElementStrategyFactory;
  if (typeof component === 'function') {
    // A direct componentType was provided. Initialize that immediately.
    strategyFactory = new IvyNgElementStrategyFactory(
      component as any, rendererFactory, moduleLoader, contract);
  } else {
    // Create a custom element that lazily loads its backing component either
    // on user event or input change.
    strategyFactory = new IvyNgElementStrategyFactory(
      tag, rendererFactory, moduleLoader, contract);
  }

  ceRegistry.define(tag,
    createCustomElement(component, {
      injector: createInjector(),
      strategyFactory
    })
  );
}
