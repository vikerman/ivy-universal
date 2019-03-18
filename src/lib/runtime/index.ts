import { isBrowser } from '../utils/utils';
import { getCachedData, setCachedData } from '../data-cache';

export type PartialInputs<T> = {
  readonly [P in keyof T]?: T[P] extends Function ? never : T[P];
};

export async function fetchInitialData(context: {}, url: string): Promise<string> {
  if (context['__doc'] == null) {
    return Promise.reject('Invalid context object passed to fetchInitialData');
  }

  if (isBrowser()) {
    // TODO: Should there a timeout for this? How to handle errors better.
    try {
      return await getCachedData(context['__doc'], url);
    } catch (e) {
      // Fallback to just fetching the data.
    }
  }

  const resp = await fetch(url);

  if (resp.status !== 200) {
    throw new Error(`Error fetching ${url}: ${resp.status}`);
  }

  const body = await resp.text();

  if (!isBrowser()) {
    // Cache the fetched data.
    setCachedData(context['__doc'], url, body);
  }

  return body;
}
