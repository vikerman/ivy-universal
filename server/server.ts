import 'zone.js/dist/zone-node';
import 'reflect-metadata';

import * as fs from 'fs';
import * as domino from 'domino';

import { ɵrenderComponent as renderComponent } from '@angular/core';

import * as express from 'express';
import { join } from 'path';
import { getRendererFactory } from './renderer_factory';

// Enable Production mode in Ivy.
(global as any).ngDevMode = false;

// Express server
const app = express();

const PORT = process.env.PORT || 4000;
const DIST_FOLDER = join(process.cwd(), 'dist/ivy');

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const { AppComponent } = require('../dist/server/main');

// Universal express-engine.
app.engine('html',
  (filePath: string,
    options: {},
    callback: (err?: Error | null, html?: string) => void) => {
    try {
      const doc: Document = domino.createDocument(getDocument(filePath));
      const rendererFactory = getRendererFactory(doc);

      // Render the app component.
      renderComponent(AppComponent, { rendererFactory });

      callback(null, doc.documentElement.outerHTML);
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
