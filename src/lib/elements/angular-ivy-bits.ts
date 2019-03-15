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
  ViewEncapsulation,
  EventEmitter,
  ɵAPP_ROOT as APP_ROOT,
  ɵcreateInjector as createInjector,
} from '@angular/core';
import {ɵDomSanitizerImpl as DomSanitizerImpl} from '@angular/platform-browser';

import { RehydrationRendererFactory, ScopedRehydrationRendererFactory } from '../rehydration/rehydration_renderer';
import { merge, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NgElementStrategyEvent } from './element-strategy';

let domSanitizer : DomSanitizerImpl | null = null;
function getDomSanitizer(doc: Document) {
  // Reuse DOM Sanitizers across requests. There is no state saved in it.
  domSanitizer = domSanitizer || new DomSanitizerImpl(doc);
  return  domSanitizer;
}

function getRootInjector(doc: any) {
  if (doc['__rootInjector__'] == null) {
    doc['__rootInjector__'] = createInjector(null, null, [
      {provide: APP_ROOT, useValue: true}
    ]);
  }
  return doc['__rootInjector__'];
}

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
    doc: Document,
    componentType: ComponentType<T>, 
    element: Element,
    hostFeatures: Array<(<U>(c: U, cd: ComponentDef<U>) => void)>,
    // TODO: Type to RendererFactory3 once it's exposed publicly
    rendererFactory?: any) {

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
    injector: getRootInjector(doc),
    sanitizer: getDomSanitizer(doc),
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
