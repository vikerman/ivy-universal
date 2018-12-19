import 'zone.js/dist/zone-node';
import 'reflect-metadata';

import * as fs from 'fs';
import * as domino from 'domino';

import { ɵrenderComponent as renderComponent } from '@angular/core';

import * as express from 'express';
import {join} from 'path';
import { RendererFactory3, ObjectOrientedRenderer3 } from '@angular/core/src/render3/interfaces/renderer';

(global as any).ngDevMode = false;

// Express server
const app = express();

const PORT = process.env.PORT || 4000;
const DIST_FOLDER = join(process.cwd(), 'dist/ivy');

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const {AppComponent} = require('../dist/server/main');

// Should match
// node_modules/domino/lib/MutationConstants.js
enum MutationType {
  VALUE = 1,  // The value of a Text, Comment or PI node changed
  ATTR = 2,   // A new attribute was added or an attribute value and/or prefix
              // changed
  REMOVE_ATTR = 3,  // An attribute was removed
  REMOVE = 4,       // A node was removed
  MOVE = 5,         // A node was moved
  INSERT = 6        // A node (or a subtree of nodes) was inserted
}

interface DominoMutationEvent {
  type: MutationType;
  target: HTMLElement&{[k: string]: Function | undefined};
  node?: HTMLElement&{[k: string]: Function | undefined};
  attr?: {data: string, name: string};
}

const START_COMMENT = '__start__';

// Universal express-engine.
app.engine('html', 
    (filePath: string, 
     options: {},
     callback: (err?: Error | null, html?: string) => void) => {
  try {
    let doc: Document = domino.createDocument(getDocument(filePath));
    let commentIndex = 0;

    // Patch the Domino mutation handler to insert the start comment node
    // whenever the end comment node is inserted.
    (doc as any)._setMutationHandler((event: DominoMutationEvent) => {
      const target = event.target;
      const node = event.node!;
      switch (event.type) {
        case MutationType.INSERT:
          if ((node as any)[START_COMMENT] != null) {
            target.insertBefore((node as any)[START_COMMENT], node);
          }
          break;
      }
    });

    const createServerRenderer = (doc: Document): ObjectOrientedRenderer3 => {
      return {
        createComment: (data: string) => {
          // Create two comments and send it to client so that there is a 
          // matching comment block that can be used to identify binding 
          // template sections (Ex. ngIf, ngFor).
          const startComment = doc.createComment('s' + commentIndex.toString(16));
          const endComment = doc.createComment('e' + commentIndex.toString(16));
          (endComment as any)[START_COMMENT] = startComment;
          commentIndex++;
          return endComment;
        },
        createElement: (tag: string) => doc.createElement(tag),
        createElementNS: (namespace: string, tag: string) => 
          doc.createElementNS(namespace, tag) as any,
        createTextNode: (data: string) => doc.createTextNode(data),
        querySelector: (selectors: string) => doc.querySelector(selectors) as any,
      }
    };

    const rendererFactory: RendererFactory3 = {
      createRenderer: (hostElement: any, rendererType: any) => { 
        return createServerRenderer(doc);
      }
    }
    
    // Render the app component.
    renderComponent(AppComponent, {rendererFactory: rendererFactory});

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

