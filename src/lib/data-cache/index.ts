/**
 * A producer/consumer cache that returns a Promise for a cache entry not found
 * till the cached entry is returned.
 */

const CACHE = '__data_cache__';

export interface CacheEntry<T> {
  value?: T;
  waiters?: Array<{
    resolve: (value: T) => void;
    reject: (reason: any) => void;
  }>;
}

export function getCache(doc: Document): Map<string, CacheEntry<string>> {
  if (doc[CACHE] == null) {
    doc[CACHE] = new Map<string, CacheEntry<string>>();
  }
  return doc[CACHE];
}

/**
 * Set the cached data and signal all waiting get requests.
 */
export function setCachedData(doc: Document, url: string, text: string) {
  const cache = getCache(doc);
  if (!cache.has(url)) {
    cache.set(url, {value: text});
    return;
  }
  const entry = cache.get(url);
  if (entry.value == null) {
    if (entry.waiters) {
      for (const w of entry.waiters) {
        // Delete the cached value after single use.
        cache.delete(url);
        w.resolve(text);
      }
      entry.waiters = [];
    }
  }
  entry.value = text;
  cache.set(url, entry);
}

/**
 * Get cached data or return a Promise that is resolved when the data is set.
 */
export function getCachedData(doc: Document, key: string): Promise<string> {
  const cache = getCache(doc);
  let entry: CacheEntry<string>|null = null;
  if (cache.has(key)) {
    entry = cache.get(key);
    if (entry.value != null) {
      return Promise.resolve(entry.value);
    }
  }
  else {
    entry = {waiters: []};
    cache.set(key, entry);
  }
  if (doc.readyState !== 'loading') {
    // No use waiting for future cached data as document has finished loading.
    return Promise.reject();
  }
  return new Promise((resolve, reject) => {
    entry.waiters.push({resolve, reject});
    // Cancel any pending cache reads if the document has finished loading.
    doc.addEventListener('DOMContentLoaded', reject);
  });
}
