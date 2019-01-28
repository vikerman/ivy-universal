import * as fetch from 'node-fetch-npm';

// Count the number of oustanding fetches.
let pendingFetchCount = 0;
let waitResolve: Function | null = null;

export function getNodeFetch(hostname: string, port: number) {
 return (url: string): Promise<string> => {
    if (url.startsWith('/')) {
      url = url.substr(1);
    }
    url = `http://${hostname}:${port}/` + url;
    pendingFetchCount++;
    return fetch(url).then(r => {
      if (--pendingFetchCount === 0 && waitResolve) {
        waitResolve(true);
        waitResolve = null;
      }
      return r.text();
    });
  }
}

export function waitForFetches(): Promise<boolean> {
  if (pendingFetchCount === 0) {
    return Promise.resolve(false);
  }
  return new Promise((resolve, _reject) => {
    waitResolve = resolve;
  });
}

export function getPendingFetchCount() {
  return pendingFetchCount;
}
