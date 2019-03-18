// TODO: Simplify this file enough so that devs can configure custom express settings in this file
// as needed without having to wade through all this code.

import * as fs from 'fs';

// TODO : Replace with actual domino once https://github.com/fgnass/domino/pull/138
// is merged.
import * as domino from 'ivy-domino';

// Setup global class types that are needed since devmode sources don't
// down-level decorators which point to these values during runtime.
Object.assign(global, (domino as any).impl);

import * as express from 'express';
import { join } from 'path';
import { getRendererFactory } from './lib/server/server_renderer_factory';
import { patchDocument } from './lib/server/custom_elements_shim';
import { waitForFetches, getPendingFetchCount, getFetch } from './lib/server/fetch';

// Keep the following as `require` so that webpack doesn't move it before HTMLElement is defined
// above.
const { registerCustomElement }  = require('./lib/elements/register-custom-element');
const { registerRouterElement } = require('./lib/router-impl/router');
const NG_BITS = require('./lib/elements/angular-ivy-bits');

import {ROUTES} from './routes';
import {ELEMENTS_MAP} from './elements.server';
import { ɵComponentType as ComponentType } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { getCache, CacheEntry } from './lib/data-cache';

// Enable Production mode in Ivy on server.
(global as any).ngDevMode = false;

// Express server
const app = express();

const PORT = parseInt(process.env.PORT) || 4200;

// User 'src' for index.html if using Bazel build.
const DIST_FOLDER = join(process.cwd(), process.env.RUNFILES ? 'src/package' : 'dist/ivy');

// Polyfill fetch in global scope.
(global as any)['fetch'] = getFetch('localhost', PORT.toString());

function waitForNextTick(): Promise<void> {
  return new Promise((resolve, _) => {
    setTimeout(resolve, 0);
  });
}

async function waitForRenderComplete(doc: Document) {
  do {
    await waitForFetches(doc);
    await waitForNextTick();
  } while (getPendingFetchCount(doc) > 0);
}

// Patch addEventListener to setup jsaction attributes.
let actionIndex = 0;
function patchedAddEventListener(type, listener, options) {
  const el: Element = this;
  const doc: any = el.ownerDocument;
  // Get the currently rendererd custom element tag name.
  const localName = doc.__current_element__.localName;
  type = type === 'click' ? '' : `${type}:`;

  // Add a jsaction with hint on which Custom Element handles the event.
  // TODO: Probably need to look for corner cases around self nested components
  // with content projection.
  el.setAttribute('tsaction', `${type}${localName}.${actionIndex++}`);

  oldEventListener.call(this, type, listener, options);
};
const oldEventListener = Node.prototype.addEventListener;
Node.prototype.addEventListener = patchedAddEventListener;

function serializeSeenElements(doc: Document, shellEl: HTMLElement) {
  const elements = {};
  const d: Document & {_seenElements: Map<string, number>} = doc as any;
  d._seenElements.forEach((val, key) => {
    elements[key] = val;
  });

  const script = doc.createElement('script');
  script.type = 'application/json';
  script.id = '_elements';
  script.appendChild(doc.createTextNode(JSON.stringify(elements)));
  shellEl.insertAdjacentElement('afterend', script);
}

function serializeCachedData(doc: Document) {
  const cache: Map<string, CacheEntry<string>> = getCache(doc);
  if (cache.size == 0) {
    return;
  }
  const cacheObj = {};
  for (const key of Array.from(cache.keys())) {
    cacheObj[key] = cache.get(key).value;
  }
  const dataEl =  doc.createElement('data-cache');
  const script =  doc.createElement('script');
  script.type = 'application/json';
  script.appendChild(doc.createTextNode(JSON.stringify(cacheObj)));
  dataEl.appendChild(script);
  doc.body.insertAdjacentElement('beforeend', dataEl);
}

// Universal express-engine.
app.engine('html',
  (filePath: string,
    options: { req: { originalUrl: string} },
    callback: (err?: Error | null, html?: string) => void) => {
    try {
      const doc: Document = domino.createDocument(getDocument(filePath));
      patchDocument(doc);
      (doc as any).__elements_map__ = ELEMENTS_MAP;

      // Initialize seen component map and id for CSS encapsulation.
      (doc as any)._seenElements = new Map();
      (doc as any)._nextCompId = 0;

      // TODO: Clone the CustomElementRegistry instead of recreating it every
      // time?
      const elements = Object.keys(ELEMENTS_MAP);
      for (const element of elements) {
        const componentType: ComponentType<any> = ELEMENTS_MAP[element];
        const encapsulation = componentType.ngComponentDef['encapsulation'];
        const scoped = encapsulation != null ?
          encapsulation === ViewEncapsulation.Emulated : false;

        const rendererFactory = getRendererFactory(doc, scoped);

        registerCustomElement(
          doc,
          (doc as any).__ce__,
          () => NG_BITS,
          element,
          ELEMENTS_MAP[element],
          rendererFactory
        );
      }

      registerRouterElement(doc, (doc as any).__ce__, options.req.originalUrl, ROUTES);

      // Add the shell component. This will trigger the rendering of the
      // app starting from the shell.
      const shell = doc.createElement('shell-root');
      doc.body.insertAdjacentElement('afterbegin', shell);

      // Wait for all outstanding fetches and rendering to complete.
      waitForRenderComplete(doc).then(() => {
        // Add the current state of the _seenElements map.
        serializeSeenElements(doc, shell);

        // Serialize cached data.
        serializeCachedData(doc);

        callback(null, doc.documentElement.outerHTML);
      });
    } catch (e) {
      callback(e);
    }
  });

app.set('view engine', 'html');
app.set('views', DIST_FOLDER);

// Server static files from DIST folder.
app.get('*.*', express.static(DIST_FOLDER, {
  maxAge: '1y',
  fallthrough: false
}));

// All regular routes use the Universal engine
app.get('*', (req, res) => {
  res.render('index', { req });
});

// Start up the Node server
app.listen(PORT, () => {
  // Don't change this message or livereload in dev mode would stop working :)
  console.log(`Node Express server listening on http://localhost:${PORT}`);
});

/**
 * This holds a cached version of each index used.
 */
const templateCache: { [key: string]: string } = {};

/**
 * Get the document at the file path
 */
function getDocument(filePath: string): string {
  if (templateCache[filePath]) {
    return templateCache[filePath];
  }
  let contents = fs.readFileSync(filePath).toString();
  // Add livereload script if in dev mode
  if (process.env['DEV_MODE']) {
    contents = contents.replace('</head>',
      `<script src="http://localhost:35729/livereload.js?snipver=1"></script></head>`);
  }
  templateCache[filePath] = contents;
  return contents;
}
