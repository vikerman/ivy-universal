import { RendererFactory3, ObjectOrientedRenderer3 } from '@angular/core/src/render3/interfaces/renderer';

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

// Create a server renderer that adds hints about embedded templates.
const createServerRenderer = (doc: Document): ObjectOrientedRenderer3 => {
  let commentIndex = 0;
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

export function getRendererFactory(doc: Document): RendererFactory3 {
  return {
    createRenderer: (hostElement: any, rendererType: any) => {
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

      return createServerRenderer(doc);
    }
  };
}