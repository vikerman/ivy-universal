import { isBrowser } from '../utils/utils';
import { getCachedData, setCachedData } from '../data-cache';
import { Subscription } from 'rxjs';

export type PartialInputs<T> = {
  readonly [P in keyof T]?: T[P] extends Function ? never : T[P];
};

export const DOC = '__doc__';

async function fetchInitialData(context: {}, url: string): Promise<string> {
  if (context[DOC] == null) {
    return Promise.reject('Invalid context object passed to fetchInitialData');
  }

  if (isBrowser()) {
    // TODO: Should there a timeout for this? How to handle errors better.
    try {
      return await getCachedData(context[DOC], url);
    } catch (e) {
      // Fallback to just fetching the data.
      return await (await fetch(url)).text();
    }
  }

  const resp = await fetch(url);

  if (resp.status !== 200) {
    throw new Error(`Error fetching ${url}: ${resp.status}`);
  }

  const body = await resp.text();

  if (!isBrowser()) {
    // Cache the fetched data.
    setCachedData(context[DOC], url, body);
  }

  return body;
}

/** Private symbol */
export const RESOLVERS = '__resolvers__';

export type ResolverFn = (ctx: {}) => Promise<{}>;

/**
 * Decorator to create a resolver that fetches initial data.
 */
export function InitialData(url: ((ctx: {}) => string) | string) {
  return (target: any, propertyKey: string) => {
    const resolvers: Map<string, ResolverFn> = target.constructor[RESOLVERS] ||
      new Map<string, ResolverFn>();
    const resolver = (ctx: {}) => {
      return fetchInitialData(ctx, typeof url === 'string' ? url : url(ctx)).then(text => {
        try { 
          return JSON.parse(text);
        } catch (e) {
          return text;
        }
      })
    };
    resolvers.set(propertyKey, resolver);
    target.constructor[RESOLVERS] = resolvers;
  };
}

/**
 * Custom Dispatchers for @Output.
 */

/** Private symbol */
export const DISPATCHERS = '__dispatchers__';

export type DispatcherFn = (ctx: {}, name: string, value: {}) => void;
