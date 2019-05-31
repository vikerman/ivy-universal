import { DispatcherFn, DISPATCHERS, ResolverFn, RESOLVERS, DOC } from '../runtime';
import { EventEmitterLite } from '../rxjs-lite';
import { getCachedData } from '../data-cache';

export interface StoreModule<T> {
  initialState: T;
}

export const STORE = '__store__';

/**
 * Decorator to dispacth actions from @Output properties.
 */
export function Dispatch<T>(action: string) {
  return (target: any, propertyKey: string) => {
    const dispatchers: Map<string, DispatcherFn> = target.constructor[DISPATCHERS] ||
      new Map<string, string>();
    dispatchers.set(propertyKey, (ctx: {}, name: string, value: {}): void => {
      const store = ctx[STORE] as Store;
      if (store == null) {
        console.warn('@Dispatch used but no store initialized.');
        return;
      }
      store.dispatch(action, value);
    });
    target.constructor[DISPATCHERS] = dispatchers;
  };
}

/**
 * Decorator to bind a store method to an action.
 */
export function Action(action: string) {
  return (target: any, propertyKey: string) => {
    // TODO: handle property renaming.
    const reducerDef: {[k: string]: string} = target.constructor['reducerDef'] || {};
    reducerDef[action] = propertyKey;
    target.constructor['reducerDef'] = reducerDef;
  };
}

/**
 * Decorator to consume Store state and be automaticaly updated when the state changes.
 */
export function State(selector: string) {
  return (target: any, propertyKey: string) => {
    const resolvers: Map<string, ResolverFn> = target.constructor[RESOLVERS] ||
      new Map<string, ResolverFn>();
    const resolver = (ctx: {}) => {
      const doc = ctx[DOC];
      const store = doc[STORE];
      if (store == null) {
        console.warn('@State used but no store initialized.')
        return Promise.resolve(null);
      }

      // Get the current state.
      return store.getState(selector);
    };
    resolvers.set(propertyKey, resolver);
    target.constructor[RESOLVERS] = resolvers;
  }
}

export interface StoreDef {
  [k: string] : string[];
}

interface ReducerType {
  new();
  'reducerDef' : {
    [k: string]: string;
  }
};

interface ReducerInfo {
  name: string;
  instance: {};
  method: Function;
};

export const STATE_KEY = ':state';

/**
 * The State Store. No visible directly to user.
 * Use @Dispatch, @State to indirectly interact with this Store.
 */
export class Store {
  private state : {[k: string]: {}}|null = null;
  private loadedReducers = new Map<string, ReducerInfo>();
  private selectorMap = new Map<string, EventEmitterLite<{}>>();

  constructor(
    private doc: Document,
    private storeDef: StoreDef,
    private loadModule: (name: string) => Promise<{}>) {}

  private executeReducer(reducerInfo: ReducerInfo, payload: {}) {
    this.state[reducerInfo.name] = reducerInfo.method.call(reducerInfo.instance,
      {...this.state[reducerInfo.name]}, payload);
    
    if (this.selectorMap.has(reducerInfo.name)) {
      this.selectorMap.get(reducerInfo.name).emit(this.state[reducerInfo.name]);
    }
  }

  private async loadAndExecuteReducer(reducer: string, action: string, payload: {}) {
    const reducerModule = await this.loadModule(reducer);
    
    // Avoid race condition from two loads.
    if (this.loadedReducers.has(reducer)) {
      this.executeReducer(this.loadedReducers.get(reducer), payload);
    }
    
    for (let exp in reducerModule) {
      if (reducerModule.hasOwnProperty(exp)) {
        if (typeof reducerModule[exp] === 'function' && reducerModule[exp]['reducerDef'] != null) {
          const reducerClass = reducerModule[exp] as ReducerType;
          const reducerInstance = new reducerClass() as StoreModule<{}>;
          const reducerMethod = reducerClass['reducerDef'][action];

          const reducerInfo = {
            name: reducer,
            instance: reducerInstance,
            method: reducerInstance[reducerMethod]
          };

          this.loadedReducers.set(reducer, reducerInfo);
          
          // Initialize store if needed.
          if (this.state == null) {
            const ignored = await this.getState(reducer);
          }

          // Set initial state if not still initialized.
          if (this.state[reducer] == null) {
            this.state[reducer] = reducerInstance.initialState;
          }

          // Initialize this module for the store.
          this.executeReducer(reducerInfo, payload);

          break;
        }
      }
    }
  }

  async getState(selector: string): Promise<{}> {
    if (this.state == null) {
      this.state = JSON.parse(await getCachedData(this.doc, STATE_KEY));
    }
    if (this.state[selector] === undefined) {
      // Load initial state.
      const reducerModule = await this.loadModule(selector);
  
      // Avoid race condition from two loads.
      if (!this.loadedReducers.has(selector)) {
        for (let exp in reducerModule) {
          if (reducerModule.hasOwnProperty(exp)) {
            if (typeof reducerModule[exp] === 'function' && reducerModule[exp]['reducerDef'] != null) {
              const reducerClass = reducerModule[exp] as ReducerType;
              const reducerInstance = new reducerClass() as StoreModule<{}>;
              const reducerMethod = reducerClass['reducerDef'][action];

              const reducerInfo = {
                name: selector,
                instance: reducerInstance,
                method: reducerInstance[reducerMethod]
              };

              this.loadedReducers.set(selector, reducerInfo);
              this.state[selector] = reducerInstance.initialState;
            }
          }
        }
      }
    }
    return this.state[selector];
  }

  /* Dispatch an action */
  dispatch(action: string, payload: {}): void {
    const reducers = this.storeDef[action] || [];
    for (const reducer of reducers) {
      if (this.loadedReducers.has(reducer)) {
        this.executeReducer(this.loadedReducers.get(reducer), payload);
      } else {
        this.loadAndExecuteReducer(reducer, action, payload);
      }
    }
    // TODO: Run through effects.
  }

  select(selector: string): EventEmitterLite<{}> {
    if (this.selectorMap.has(selector)) {
      return this.selectorMap.get(selector);
    }
    const eventEmitter = new EventEmitterLite<{}>();
    this.selectorMap.set(selector, eventEmitter);
    return eventEmitter;
  }
}