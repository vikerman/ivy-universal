import { setCachedData } from '.';

/**
 * Register a `data-cache` custom element that asynchronously adds newly
 * arrived data to the data cache.
 */
export function registerDataCacheElement() {
  class DataCacheElement extends HTMLElement {
    connectedCallback() {
      setTimeout(() => {
        // Get the JSON within the script element inside and add it to the cache.
        const scriptEl = this.firstElementChild;
        if (scriptEl != null && scriptEl.localName === 'script') {
          const cache = JSON.parse(scriptEl.textContent);
          for (const key of Object.keys(cache)) {
            setCachedData(document, key, cache[key]);
          }
        }
      }, 0);
    }
  }
  customElements.define('data-cache', DataCacheElement)
}
