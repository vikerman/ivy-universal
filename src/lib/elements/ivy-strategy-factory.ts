import { NgElementStrategy, NgElementStrategyEvent, NgElementStrategyFactory } from '@angular/elements';
import {
  EventEmitter,
  Injector,
  ɵLifecycleHooksFeature as LifecycleHooksFeature,
  ɵmarkDirty as markDirty,
  ɵrenderComponent as renderComponent,
  ɵComponentType as ComponentType,
} from '@angular/core';
import { merge, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ComponentDef } from '@angular/core/src/render3';
import { RendererFactory3 } from '@angular/core/src/render3/interfaces/renderer';

/** Time in milliseconds to wait before destroying the component ref when disconnected. */
const DESTROY_DELAY = 10;

export class IvyNgElementStrategyFactory<T> implements NgElementStrategyFactory {

  constructor(private componentType: ComponentType<T>, private rendererFactory?: RendererFactory3) { }

  create(injector: Injector): NgElementStrategy {
    return new IvyNgElementStrategy(this.componentType, this.rendererFactory);
  }
}

export class IvyNgElementStrategy<T> implements NgElementStrategy {
  /** Merged stream of the component's output events. */
  // TODO(issue/24571): remove '!'.
  events: Observable<NgElementStrategyEvent>;

  /** Reference to the component that was created on connect. */
  // TODO(issue/24571): remove '!'.
  private component !: T | null;

  /** Reference number returned by setTimeout when scheduling to destroy. */
  private destroyTimeoutRef: number | null = null;

  /** Initial input values that were set before the component was created. */
  private readonly initialInputValues = new Map<string, any>();

  constructor(private componentType: ComponentType<T>, private rendererFactory?: RendererFactory3) { }

  /**
   * Initializes a new component if one has not yet been created and cancels any scheduled
   * destruction.
   */
  connect(element: HTMLElement): void {
    if (this.destroyTimeoutRef !== null) {
      clearTimeout(this.destroyTimeoutRef);
      this.destroyTimeoutRef = null;
      return;
    }

    if (!this.component) {
      this.initializeComponent(element);
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

  /**
   * Returns the component property value.
   */
  getInputValue(propName: string): any {
    if (!this.component) {
      return this.initialInputValues.get(propName);
    }

    return this.component[propName];
  }

  /**
   * Sets the input value for the property.
   */
  setInputValue(propName: string, value: string): void {
    if (strictEquals(value, this.getInputValue(propName))) {
      return;
    }

    // If the component has not yet been connected, store the input values in order to
    // initialize them onto the component after connected.
    if (!this.component) {
      this.initialInputValues.set(propName, value);
      return;
    }

    this.component[propName] = value;
    markDirty(this.component);
  }


  /**
   * Renders the component on the host element and initializes the inputs and outputs.
   */
  protected initializeComponent(element: HTMLElement) {
    // Do the initial rendering with a single renderComponent call.
    // This is needed not only for efficiency but also for rehydrating properly.
    this.component = renderComponent(this.componentType, {
      host: element as any,
      hostFeatures: [
        // Initialize the component properties before rendering.
        this.initializeInputs.bind(this, element),
        LifecycleHooksFeature,
      ],
      rendererFactory: this.rendererFactory,
    });

    this.initializeOutputs();
  }

  /** Set any stored initial inputs on the component's properties. */
  protected initializeInputs(element: HTMLElement, component: any, componentDef: ComponentDef<any>): void {
    const inputs = Object.keys(this.componentType.ngComponentDef['inputs']);
    inputs.forEach(prop => {
      component[prop] = element[prop];
    });
  }

  /** Sets up listeners for the component's outputs so that the events stream emits the events. */
  protected initializeOutputs(): void {
    const outputs = Object.keys(this.componentType.ngComponentDef['outputs']);
    const eventEmitters = outputs.map(propName => {
      const templateName = this.componentType.ngComponentDef['outputs'][propName];

      const emitter = this.component[propName] as EventEmitter<any>;
      return emitter.pipe(map((value: any) => ({ name: templateName, value })));
    });

    this.events = merge(...eventEmitters);
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