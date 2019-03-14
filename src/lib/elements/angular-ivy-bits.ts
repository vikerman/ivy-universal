/**
 * This file contains all the dependencies of the Ivy strategy on Ivy
 * so that it can lazy loaded when the first Ivy Element is actually loaded on
 * the client. This module should be dynamically import()-ed by the client
 * and passed to the LazyIvyElementStrategyFactory.
 * 
 * On the server it is just provided using an immediately resolved Promise. 
 */

import {
  ɵLifecycleHooksFeature as LifecycleHooksFeature,
  ɵmarkDirty,
  ɵrenderComponent as renderComponent,
  ɵComponentType as ComponentType,
  ɵComponentDef as ComponentDef,
  Injector,
  ViewEncapsulation,
  EventEmitter,
} from '@angular/core';
import { RendererFactory3 } from '@angular/core/src/render3/interfaces/renderer';

import { RehydrationRendererFactory, ScopedRehydrationRendererFactory } from '../rehydration/rehydration_renderer';
import { merge, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NgElementStrategyEvent } from './element-strategy';

export function createStyle(doc: Document, styles: string[], compId: number) {
 const styleEl = doc.createElement('style');
  styleEl.type = 'text/css';

  let cssData = '';
  for (const style of styles) {
    cssData += style.replace(/%COMP%/g, compId.toString());
  }

  styleEl.appendChild(doc.createTextNode(cssData));
  doc.head.appendChild(styleEl);
}

export function render<T>(
    componentType: ComponentType<T>, 
    element: Element,
    hostFeatures: Array<(<U>(c: U, cd: ComponentDef<U>) => void)>,
    injector?: Injector,
    rendererFactory?: RendererFactory3) {

  // Use the provided rendererFactory or default to the Rehydration one. Use the
  // one with scoped CSS if that is requested.
  const encapsulation = componentType.ngComponentDef['encapsulation']
  const scoped =  encapsulation != null ?
    encapsulation === ViewEncapsulation.Emulated : false;
  if (!rendererFactory) {
    rendererFactory = scoped ? ScopedRehydrationRendererFactory : RehydrationRendererFactory;
  }

  return renderComponent(componentType, {
    host: element as any,
    hostFeatures: [
      ...hostFeatures,
      LifecycleHooksFeature,
    ],
    rendererFactory: rendererFactory,
    injector: injector,
  });
}

export const markDirty = ɵmarkDirty;

export function initializeOutputs<T>(
    component: T,
    componentType: ComponentType<T>,
    registerEventType: (name: string) => void): 
    Observable<NgElementStrategyEvent> {
  const outputs = Object.keys(componentType.ngComponentDef['outputs']);
  const eventEmitters = outputs.map(propName => {
    const templateName = componentType.ngComponentDef['outputs'][propName] as string;

    registerEventType(templateName);

    const emitter = component[propName] as EventEmitter<any>;
    return emitter.pipe(map((value: any) => ({ name: templateName, value })));
  });

  return merge(...eventEmitters);  
}
