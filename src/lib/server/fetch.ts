const fetch = require('node-fetch').default;

const PENDING_RESOLVES = '__pending_resolves__';
const WAIT_RESOLVE = '__wait_resolve__';

/**
 * Get a fetch polyfill that uses hostname and port to convert relative paths to absolute paths
 * required on the server.
 */
export function getFetch(host: string, port: string): (url: string) => Promise<string> {
  return (url: string) : Promise<string> => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.startsWith('/')) {
        url = url.substr(1);
      }
      url = `http://${host}:${port}/${url}`;
    }
    return fetch(url);
  }
}

export function waitForFetches(doc: Document): Promise<boolean> {
  if (doc[PENDING_RESOLVES] == null || doc[PENDING_RESOLVES] === 0) {
    return Promise.resolve(false);
  }
  return new Promise((resolve, _reject) => {
    doc[WAIT_RESOLVE] = resolve;
  });
}

export function getPendingFetchCount(doc: Document): number {
  return doc[PENDING_RESOLVES] || 0;
}
