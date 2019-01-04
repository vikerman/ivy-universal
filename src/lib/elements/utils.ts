/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector, Type } from '@angular/core';

/**
 * Convert a camelCased string to kebab-cased.
 */
export function camelToDashCase(input: string): string {
  return input.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
}

/**
 * Create a `CustomEvent` (even on browsers where `CustomEvent` is not a constructor).
 */
export function createCustomEvent(doc: Document, name: string, detail: any): CustomEvent {
  const bubbles = false;
  const cancelable = false;

  // On IE9-11, `CustomEvent` is not a constructor.
  if (typeof CustomEvent !== 'function') {
    const event = doc.createEvent('CustomEvent');
    event.initCustomEvent(name, bubbles, cancelable, detail);
    return event;
  }

  return new CustomEvent(name, { bubbles, cancelable, detail });
}

/**
 * Test two values for strict equality, accounting for the fact that `NaN !== NaN`.
 */
export function strictEquals(value1: any, value2: any): boolean {
  return value1 === value2 || (value1 !== value1 && value2 !== value2);
}

/** Gets a map of default set of attributes to observe and the properties they affect. */
export function getDefaultAttributeToPropertyInputs(
  inputs: { propName: string, templateName: string }[]) {
  const attributeToPropertyInputs: { [key: string]: string } = {};
  inputs.forEach(({ propName, templateName }) => {
    attributeToPropertyInputs[camelToDashCase(templateName)] = propName;
  });

  return attributeToPropertyInputs;
}

/**
 * Gets a component's set of inputs. Uses the injector to get the component factory where the inputs
 * are defined.
 */
export function getComponentInputs(
  component: Type<any>, injector: Injector): { propName: string, templateName: string }[] {
  // DO NOT use the actual ComponentFactoryResolver token here.
  // It is not used and will pull in entire @angular/core into the main chunk!!!
  const componentFactoryResolver = injector.get('dummy');
  const componentFactory = componentFactoryResolver.resolveComponentFactory(component);
  return componentFactory.inputs;
}
