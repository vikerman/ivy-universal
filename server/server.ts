import * as fs from 'fs';

// tslint:disable-next-line:no-any
(global as any).__domino_frozen__ = false;

// TODO : Replace with actual domino once https://github.com/fgnass/domino/pull/138
// is merged.
import * as domino from 'ivy-domino';

// Setup global class types that are needed since devmode sources don't
// down-level decorators which point to these values during runtime.
Object.assign(global, (domino as any).impl);

// tslint:enable:no-any

import { ɵrenderComponent as renderComponent } from '@angular/core';

import * as express from 'express';
import { join } from 'path';
import { getRendererFactory } from './server_renderer_factory';
import { patchDocument } from './custom_elements_shim';

// Enable Production mode in Ivy.
(global as any).ngDevMode = false;

// Express server
const app = express();

const PORT = process.env.PORT || 4000;
const DIST_FOLDER = join(process.cwd(), 'dist/ivy');

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const { AppComponent, ELEMENTS_MAP, bootstrapCustomElement } = require('../dist/server/main');

// Universal express-engine.
app.engine('html',
  (filePath: string,
    options: {},
    callback: (err?: Error | null, html?: string) => void) => {
    try {
      const doc: Document = domino.createDocument(getDocument(filePath));
      patchDocument(doc);
      const rendererFactory = getRendererFactory(doc);

      // TODO: Clone the CustomElementRegistry instead of recreating it every
      // time?
      const elements = Object.keys(ELEMENTS_MAP);
      for (const element of elements) {
        bootstrapCustomElement((doc as any).__ce__,
          element, ELEMENTS_MAP[element], rendererFactory);
      }

      // Render the app component.
      renderComponent(AppComponent, { rendererFactory });

      // Render in the next tick after all microtasks have been flushed.
      // This is needed to make sure all the custom elements have been rendered.
      setTimeout(() => callback(null, doc.documentElement.outerHTML), 0);
    } catch (e) {
      callback(e);
    }
  });

app.set('view engine', 'html');
app.set('views', DIST_FOLDER);

// Example Express Rest API endpoints
// app.get('/api/**', (req, res) => { });
// Server static files from /browser
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
