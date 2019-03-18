// assert: Only types should be imported from @angular/core and rxjs.
import {
  Injector,
  ɵComponentType as ComponentType,
  ɵComponentDef as ComponentDef
} from '@angular/core';
import { Observable } from 'rxjs';

import { NgElementStrategy, NgElementStrategyEvent, NgElementStrategyFactory } from './element-strategy';
import { camelToDashCase } from './utils';
import { isNode, getComponentId } from '../utils/utils';
import { EventContract } from '../tsaction/event_contract';

/** Time in milliseconds to wait before destroying the component ref when disconnected. */
const DESTROY_DELAY = 10;
const PENDING_RESOLVES = '__pending_resolves__';
const WAIT_RESOLVE = '__wait_resolve__';

interface Resolver {
  getInitialInputs?: (properties: {}) => Promise<{}>;
}

export class LazyIvyElementStrategyFactory<T> implements NgElementStrategyFactory {

  constructor(
    private doc: Document,
    private ngBitsLoader: () => Promise<any>,
    private componentType: ComponentType<T> | string,
    // TODO: Type to RendererFactory3 once it's exposed publicly
    private rendererFactory?: any,
    private moduleLoader?: (module: string) => Promise<any>,
    private contract?: EventContract
  ) { }

  create(): NgElementStrategy {
    return new LazyIvyElementStrategy(this.doc,
      this.ngBitsLoader, this.componentType,
      this.rendererFactory, this.moduleLoader, this.contract);
  }
}

interface NgBits<T> {
  createStyle(doc: Document, styles: string[], compId: number);

  render<T>(
    doc: Document,
    componentType: ComponentType<T>,
    element: Element,
    hostFeatures: Array<(<U>(c: U, cd: ComponentDef<U>) => void)>,
    injector?: Injector,
    // TODO: Type to RendererFactory3 once it's exposed publicly
    rendererFactory?: any): T;

  markDirty(component: T): void;

  initializeOutputs<T>(
    component: T,
    componentType: ComponentType<T>,
    registerEventType: (type: string) => void): Observable<NgElementStrategyEvent>;
}

/**
 * An Ivy Element that lazily bootstraps when one of the following events occur
 * 1) If ComponentType(non-string) is passed into the constructor (ELSE) 
 * 2) If Element is not server-side rendered then load when IntersectionObserver
 *    goes off (ELSE)
 * 3) If Element is SSR-ed:
 *   a) If an event handler inside the Element goes off (ELSE)
 *   b) If the input properties to the Element changes
 */
export class LazyIvyElementStrategy<T> implements NgElementStrategy {
  /* Whether the Custom Element loads the component in a lazy manner */
  private isLazy: boolean;

  /* Whether the Custom Element is connected to an element */
  private isConnected = false;

  /** Merged stream of the component's output events. */
  events: Observable<NgElementStrategyEvent>;

  /**
   * Module containing Angular related bits.
   * Will be loaded lazily in case the Element is loaded lazily.
   */
  private ngBits: NgBits<T> | null = null;

  /** Reference to the component that was created on connect. */
  // TODO(issue/24571): remove '!'.
  private component !: T | null;

  /** Store backing Element for lazy initialization later */
  private element: HTMLElement;

  /** Callback to tell the parent custom element component is fully ready */
  private upgradedCallback: Function;

  /* Whether the backing component is being lazily loaded */
  private loading = false;

  /** Reference number returned by setTimeout when scheduling to destroy. */
  private destroyTimeoutRef: number | null = null;

  /** Initial properties that were set before the element connected. */
  private readonly initialProperties = new Map<string, any>();

  /** Properties that were set after the element connected. */
  private newProperties: Map<string, any> | null = null;

  constructor(
    private doc: Document,
    private ngBitsLoader: () => NgBits<T> | Promise<NgBits<T>>,
    private componentType: ComponentType<T> | string,
    // TODO: Type to RendererFactory3 once it's exposed publicly
    private rendererFactory?: any,
    private moduleLoader?: (module: string) => Promise<any>,
    private contract?: EventContract) {
      this.isLazy = typeof this.componentType === 'string'; 
    }

  /**
   * Initializes a new component if one has not yet been created and cancels any scheduled
   * destruction.
   */
  connect(element: HTMLElement, upgradeCallback: () => void): void {
    if (this.destroyTimeoutRef !== null) {
      clearTimeout(this.destroyTimeoutRef);
      this.destroyTimeoutRef = null;
      return;
    }

    this.isConnected = true;
    this.element = element;
    this.upgradedCallback = upgradeCallback;

    // Eagerly initialize component if ComponentType is immediately available.
    if (!this.isLazy) {
      if (!this.component) {
        // Non-Lazy mode. Just get the ngBits synchronously.
        this.ngBits = this.ngBitsLoader() as NgBits<T>;

        // Reflect initial properties to attributes on the server so that
        // the component can be rehydrated in the same state on the client.
        // It is assumed the Input properties are not changed from within
        // the component.
        if (isNode()) {
          const propNames = Object.keys(
            (this.componentType as ComponentType<T>).ngComponentDef['inputs']);
          for (const propName of propNames) {
            const attributeName = camelToDashCase(propName);
            const value = element[propName] || this.initialProperties.get(propName);
            if (value != null) {
              const jsonValue =
                JSON.stringify(value).replace(/\"/g, '\'');
              element.setAttribute(attributeName, jsonValue);
            }
          }
        }

        // Resolve initial inputs.
        const init = () => {
          this.initializeComponent(element,
            this.componentType as ComponentType<T>);
        };
        // TODO: Handle error thrown during resolve.
        this.resolveInitialData().then(init).catch(init);
      }
    } else {
      if (this.initialProperties.get('_boot') != null || 
          !this.isServerSideRendered()) {
        // There are buffered events or just client-side rendered 
        // component. Let's go!
        this.loadAndInitializeComponent();
      }
    }
  }

  /**
   * Schedules the component to be destroyed after some small delay in case the element is just
   * being moved across the DOM.
   */
  disconnect(): void {
    if (!this.component || this.destroyTimeoutRef !== null) {
      return;
    }

    this.scheduleDestroy();
  }

  private getTemplateNameFromPropertyName(prop: string): string {
    // assert: this.component != null
    return (this.componentType as ComponentType<T>)
      .ngComponentDef['inputs'][prop];
  }

  private isServerSideRendered() {
    return this.element.getAttribute('_s') != null;
  }

  /**
   * Returns the component property value.
   */
  getInputValue(propName: string): any {
    if (!this.component) {
      return this.initialProperties.get(propName);
    }
    const templateName = this.getTemplateNameFromPropertyName(propName);
    return this.component[templateName];
  }

  /**
   * Sets the input value for the property.
   */
  setInputValue(propName: string, value: string, attributeChanged: boolean): void {
    if (attributeChanged) {
      if (!this.isConnected) {
        // Reflect initial attribute value to initial properties. This is done
        // only for initial attribute values and not for subsequent changes.
        // (This is different from default Angular Elements behavior)
        let parsedValue = value;
        if (!isNode()) {
          // Try to JSON.parse initial attribute value only on the browser.
          if (value) {
            try {
              parsedValue = JSON.parse(value.replace(/\'/g, '"'));
            } catch (e) {
              // Just use the original value without parsing.
            }
          }
        }
        this.initialProperties.set(propName, parsedValue);
      } else if (propName === '_boot') {
        // The event buffering system asked us to boot up!
        this.loadAndInitializeComponent();
      }
      return;
    }

    const originalValue = this.getInputValue(propName);
    if (strictEquals(value, originalValue)) {
      return;
    }

    if (!this.isLazy) {
      if (!this.isConnected) {
        // These are properties that have been set on the element before it
        // was connected to the DOM.
        this.initialProperties.set(propName, value);
      } else {
        // Component is up and running. Set the `templateName` on the underlying
        // component.
        const templateName = this.getTemplateNameFromPropertyName(propName);
        this.component[templateName] = value;
        if (this.ngBits) {
          this.ngBits.markDirty(this.component);
        }
      }
      return;
    }

    // For a lazy component
    // For properties set before the connection, just store them in the initial values
    // For properties set after connection, actual load the component and do change detection
    if (!this.isConnected || !this.isServerSideRendered()) {
      this.initialProperties.set(propName, value);
    } else {
      // Clone the initial properties and set the new properties.
      if (!this.newProperties) {
        this.newProperties = new Map(this.initialProperties);
      }
      this.newProperties.set(propName, value);

      // Load the component chunk and initialize it to the new properties.
      this.loadAndInitializeComponent();
    }
  }

  private loadAndInitializeComponent(): Promise<void> {
    if (this.loading) {
      return;
    }
    this.loading = true;
    // Module name same as element localName.
    const moduleName = this.componentType as string;
    return Promise.all([this.ngBitsLoader(), this.moduleLoader(moduleName)])
        .then(([ngBits, module]) => {

      // Look for an exported memeber with ngComponentDef.
      const exports = Object.keys(module);
      let compType = null;
      // Check if the default export is a function.
      // Assume that is the component.
      if (typeof exports === 'function') {
        compType = exports;
      } else {
        for (const exp of exports) {
          // Assume there is only one exported component per module.
          if (module[exp]['ngComponentDef'] != null) {
            compType = module[exp];
            break;
          }
        }
      }

      if (!compType) {
        console.error(`Did not find any exported components in ${moduleName}`);
      } else {
        this.componentType = compType as ComponentType<T>;
        this.isLazy = false; // Behave like non-lazy component from now on.
        this.ngBits = ngBits; // Store the ngBits reference.

        // Resolve initial data from cache transferred from server.
        // Do initial rendering with initial properties so that hydration
        // can match initial state on the DOM.
        const init = () => this.initializeLoadedComponent();
        this.resolveInitialData().then(init).catch(init);
      }
    }).catch(e => {
      console.error(`Failed to load ${moduleName}`, e);
    }).finally(() => {
      this.loading = false;
    });
  }

  private incrementPendingResolves() {
    if (this.doc[PENDING_RESOLVES] == null) {
      this.doc[PENDING_RESOLVES] = 0;
    }
    this.doc[PENDING_RESOLVES]++;
  }

  private decrementPendingResolves() {
    if (--this.doc[PENDING_RESOLVES] == 0) {
      if (this.doc[WAIT_RESOLVE] != null) {
        this.doc[WAIT_RESOLVE]();
      }
    }
  }

  private resolveInitialData(): Promise<void> {
    const compType = this.componentType as ComponentType<T>&Resolver;
    if (compType.getInitialInputs) {
      const props = {};
      for (const propName of Array.from(this.initialProperties.keys())) {
        // TODO: restrict to only declared Input() properties.
        props[propName] = this.initialProperties.get(propName);
      }
      props['__doc'] = this.doc;
      try {
        // Set the rest of the initial properties based on property bag returned
        // from getInitialInputs.
        this.incrementPendingResolves();
        return compType.getInitialInputs(props).then(newProps => {
          this.decrementPendingResolves();
          for (const key of Object.keys(newProps)) {
            this.initialProperties.set(key, newProps[key]);
          }
        }).catch(() => {
          this.decrementPendingResolves();
        });
      } catch (e) {
        // TODO: Handle on server.
        this.decrementPendingResolves();
      }
    }
    return Promise.resolve();
  }

  private initializeLoadedComponent() {
    this.initializeComponent(this.element, this.componentType as ComponentType<T>);
    // Signal to the event contract that this host Element is now booted
    // and to stop buffering events.
    if (this.contract) {
      this.contract.boot(this.element);
    }
    // Restore new properties if any and run change detection.
    let changed = false;
    if (this.newProperties && this.newProperties.size > 0) {
      for (const propName of Array.from(this.newProperties.keys())) {
        const templateName = this.getTemplateNameFromPropertyName(propName);
        this.component[templateName] = this.newProperties.get(propName);
      }
      changed = true;
      this.newProperties.clear();
    }
    // Replay buffered events.
    // TODO : what's the right order of restoring new properties and
    // replaying events?
    if (this.contract) {
      this.contract.replay(this.element);
    }
    if (changed) {
      this.ngBits.markDirty(this.component);
    }
  }

  /**
   * Walk up the Element tree to find an element with an injector or null.
   *
   * @param element The backing HTMLElement
   */
  private getInheritedElementInjector(element: HTMLElement) : Injector | undefined {
    let injector: Injector | undefined = element['__injector__'];
    while (injector == null && element != null) {
      element = element.parentElement;
    }
    return injector;
  }

  /**
   * Renders the component on the host element and initializes the inputs and outputs.
   */
  protected initializeComponent(element: HTMLElement, componentType: ComponentType<T>) {
    // Initialize styles if this the first time this component is being seen.
    const name = element.localName;
    const doc: Document&{_seenElements: Map<string, number>; _nextCompId: number}
      = this.doc as any;
    if (!doc._seenElements.has(name)) {
      const compId = getComponentId(doc, name);
      const styles: string[] = componentType.ngComponentDef['styles'];
      if (styles && styles.length > 0) {
        this.ngBits.createStyle(doc, styles, compId);
      }
    }

    // Do the initial rendering with a single renderComponent call.
    // This is needed not only for efficiency but also for rehydrating properly.
    this.component = this.ngBits.render(this.doc, componentType, element,
        [
          // Initialize the component properties before rendering.
          this.initializeInputs.bind(this, element),
        ],
        this.getInheritedElementInjector(element),
        this.rendererFactory,
    );

    this.events = this.ngBits.initializeOutputs(
      this.component,
      componentType,
      type => {
        if (this.contract) {
          this.contract.listenToCustomEvent(type);
        }
      });

    // Tell the parent custom element that the component has been fully loaded!
    this.upgradedCallback();
  }

  /** Set any stored initial inputs on the component's properties. */
  protected initializeInputs(element: HTMLElement, component: any, componentDef: ComponentDef<any>): void {
    const inputs = Object.keys(componentDef['inputs']);
    inputs.forEach(prop => {
      const templateName = componentDef['inputs'][prop];
      if (templateName == null) {
        return;
      }
      const value = isNode() ?
       element[prop] || this.initialProperties.get(prop) : // On the server use the properties first for initial values.
       this.initialProperties.get(prop);
       if (value !== undefined) {
        component[templateName] = value;
       }
    });
    this.initialProperties.clear();
  }

  private scheduleDestroy() {
    this.destroyTimeoutRef = setTimeout(() => {
      if (this.component) {
        const onDestroy = this.component['ngOnDestroy'];
        if (onDestroy) {
          onDestroy();
        }
        this.component = null;
      }
    }, DESTROY_DELAY) as any;
  }
}

/**
 * Test two values for strict equality, accounting for the fact that `NaN !== NaN`.
 */
export function strictEquals(value1: any, value2: any): boolean {
  return value1 === value2 || (value1 !== value1 && value2 !== value2);
}