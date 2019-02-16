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
import * as http from 'http';
import { join } from 'path';
import { getRendererFactory } from './lib/server/server_renderer_factory';
import { patchDocument } from './lib/server/custom_elements_shim';

// Keep the following as `require` so that webpack doesn't move it before HTMLElement is defined
// above.
const { registerCustomElement }  = require('./lib/elements/register-custom-element');
const { registerRouterElement } = require('./lib/router/router');
const NG_BITS = require ('./lib/elements/angular-ivy-bits');

import {ROUTES} from './routes';
import {ELEMENTS_MAP} from './elements.server';

import {environment} from './environments/environment';

// Enable Production mode in Ivy.
if (environment.production) {
  (global as any).ngDevMode = false;
}

const DEV_MODE = process.env['DEV_MODE'];

// Express server
const app = express();

const PORT = process.env.PORT || 4200;

// User 'src' for index.html if using Bazel build.
const DIST_FOLDER = join(process.cwd(), process.env.RUNFILES ? 'src' : 'dist/ivy');

// Port to check the errors at.
const ERROR_PORT = process.env.ERROR_PORT || 8888;

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
          rendererFactory
        );
      }

      registerRouterElement(doc, (doc as any).__ce__, options.req.originalUrl, ROUTES);

      // Add the shell component. This will trigger the rendering of the
      // app starting from the shell.
      const shell = doc.createElement('shell-root');
      doc.body.insertAdjacentElement('afterbegin', shell);

      // Render in the next tick after all microtasks have been flushed.
      // This is needed to make sure all the custom elements have been rendered.
      setTimeout(() => {
        callback(null, doc.documentElement.outerHTML);
      }, 0);
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
  if (DEV_MODE) {
    // Get the errors and report if any.
    let rawData = '';
    http.get(`http://localhost:${ERROR_PORT}/`, (errorRes) => {
      errorRes.on('data', (chunk) => { rawData += chunk.toString(); });
      errorRes.on('close', () => {
        if (rawData !== '[]') {
          let errors = JSON.parse(rawData) as string[];
          res.send(errors[0]);
        } else {
          res.render('index', { req });
        }
      });
    });
  } else {
    res.render('index', { req });
  }
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
  if (DEV_MODE) {
    contents = contents.replace('</head>',
      `<script src="http://localhost:35729/livereload.js?snipver=1"></script></head>`);
  }
  templateCache[filePath] = contents;
  return contents;
}
