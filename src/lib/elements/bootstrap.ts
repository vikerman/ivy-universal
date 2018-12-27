import { createCustomElement } from '@angular/elements';
import { IvyNgElementStrategyFactory } from './ivy-strategy-factory';
import { Type, ɵComponentType as ComponentType } from '@angular/core';
import { RendererFactory3 } from '@angular/core/src/render3/interfaces/renderer';

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

export function bootstrapCustomElement<T>(ceRegistry: CustomElementRegistry,
    tag: string, component: Type<T>, rendererFactory?: RendererFactory3) {
  ceRegistry.define(tag,
    createCustomElement(component, {
      injector: createInjector(),
      strategyFactory: new IvyNgElementStrategyFactory(component as any, rendererFactory),
    })
  );
}