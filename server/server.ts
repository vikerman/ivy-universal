import * as fs from 'fs';

// TODO : Replace with actual domino once https://github.com/fgnass/domino/pull/138
// is merged.
import * as domino from 'ivy-domino';

// Setup global class types that are needed since devmode sources don't
// down-level decorators which point to these values during runtime.
Object.assign(global, (domino as any).impl);

// tslint:enable:no-any
import * as express from 'express';
import { join } from 'path';
import { getRendererFactory } from './server_renderer_factory';
import { patchDocument } from './custom_elements_shim';
import { waitForFetches, getPendingFetchCount, getNodeFetch } from './fetch';

// Enable Production mode in Ivy.
(global as any).ngDevMode = false;

// Express server
const app = express();

const PORT = parseInt(process.env.PORT) || 4000;
const DIST_FOLDER = join(process.cwd(), 'dist/ivy');

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const { ELEMENTS_MAP, NG_BITS, registerCustomElement, registerRouterElement, ROUTES } = require('../dist/server/main');

function waitForNextTick(): Promise<void> {
  return new Promise((resolve, _) => {
    setTimeout(resolve, 0);
  });
}

async function waitForRenderComplete() {
  do {
    await waitForFetches();
    await waitForNextTick();
  } while (getPendingFetchCount() > 0);
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

// Universal express-engine.
app.engine('html',
  (filePath: string,
    options: { req: { originalUrl: string} },
    callback: (err?: Error | null, html?: string) => void) => {
    try {
      const doc: Document = domino.createDocument(getDocument(filePath));
      patchDocument(doc);
      (doc as any).__elements_map__ = ELEMENTS_MAP;
      const rendererFactory = getRendererFactory(doc);

      // TODO: Clone the CustomElementRegistry instead of recreating it every
      // time?
      const elements = Object.keys(ELEMENTS_MAP);
      for (const element of elements) {
        registerCustomElement(
          (doc as any).__ce__,
          () => NG_BITS,
          element, ELEMENTS_MAP[element],
          rendererFactory,
          getNodeFetch('localhost', PORT),
        );
      }

      registerRouterElement(doc, (doc as any).__ce__, options.req.originalUrl, ROUTES);

      // Add the shell component. This will trigger the rendering of the
      // app starting from the shell.
      const shell = doc.createElement('shell-root');
      doc.body.insertAdjacentElement('afterbegin', shell);

      // Wait for all outstanding fetches and rendering to complete.
      waitForRenderComplete().then(() => {
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
  maxAge: '1y'
}));

// All regular routes use the Universal engine
app.get('*', (req, res) => {
  res.render('index', { req });
});

// Start up the Node server
app.listen(PORT, () => {
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
  return templateCache[filePath] = templateCache[filePath] || fs.readFileSync(filePath).toString();
}
