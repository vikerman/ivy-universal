/**
 * This file contains all the dependencies of the Ivy strategy on Ivy
 * so that it can lazy loaded when the first Ivy Element is actually loaded on
 * the client. This module should be dynamically import()-ed by the client
 * and passed to the LazyIvyElementStrategyFactory.
 * 
 * On the server it is just provided using an immediately resolved Promise. 
 */

import {
  EventEmitter,
  ɵLifecycleHooksFeature as LifecycleHooksFeature,
  ɵmarkDirty,
  ɵrenderComponent as renderComponent,
  ɵComponentType as ComponentType,
} from '@angular/core';
import { merge, Observer, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ComponentDef } from '@angular/core/src/render3';
import { RendererFactory3 } from '@angular/core/src/render3/interfaces/renderer';

import { RehydrationRendererFactory } from '../rehydration/rehydration_renderer';

export function render<T>(
    componentType: ComponentType<T>, 
    element: Element,
    hostFeatures: Array<(<U>(c: U, cd: ComponentDef<U>) => void)>,
    rendererFactory?: RendererFactory3 | null) {
  return renderComponent(componentType, {
    host: element as any,
    hostFeatures: [
      ...hostFeatures,
      LifecycleHooksFeature,
    ],
    // Use the provided rendererFactory or default to the Rehydration one.
    rendererFactory: rendererFactory || RehydrationRendererFactory,
  });
}

export const markDirty = ɵmarkDirty;

export function initializeOutputs<T, U>(componentType: ComponentType<T>,
    observer: Observer<U> | Subscription) {
  const outputs = Object.keys(componentType.ngComponentDef['outputs']);
  const eventEmitters = outputs.map(propName => {
    const templateName = componentType.ngComponentDef['outputs'][propName];

    const emitter = this.component[propName] as EventEmitter<any>;
    return emitter.pipe(map((value: any) => ({ name: templateName, value })));
  });

  const events = merge(...eventEmitters);
  if (observer != null) {
    // Lazy loaded Element.
    // Hook on to the existing observer.
    return events.subscribe(this.observer);
  } else {
    return events;
  }  
}
