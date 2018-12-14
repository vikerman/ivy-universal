// import { enableProdMode } from '@angular/core';
// import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// 
// import { AppModule } from './app/app.module';
// import { environment } from './environments/environment';
// 
// if (environment.production) {
//   enableProdMode();
// }
// 
// platformBrowserDynamic().bootstrapModule(AppModule)
//   .catch(err => console.error(err));

import { AppComponent } from './app/app.component';
import { ɵrenderComponent as renderComponent, RendererType2 } from '@angular/core';
import { RendererFactory3, Renderer3, RElement, ObjectOrientedRenderer3, RComment, RText } from '@angular/core/src/render3/interfaces/renderer';

class RehydrationRenderer implements ObjectOrientedRenderer3 {
  private current: Node|null = null;

  private constructor(private host: RElement) {
    this.current = (host as any as Element).firstChild;
  }

  private static currentRenderer?: RehydrationRenderer; 
  static create(hostElement: RElement) {
    if (this.currentRenderer && this.currentRenderer.host === hostElement) {
      return this.currentRenderer;
    } else {
      return (this.currentRenderer = new RehydrationRenderer(hostElement));
    }
  }

  /** Do a pre-order traversal of the tree */
  private getCurrentNodeAndAdvance() {
    if (this.current == null) {
      return null;
    }

    // Try to go one level down.
    const last = this.current;
    let next: Node;
    next = this.current.firstChild;

    // If there are no nodes below - Go to the next sibling.
    // If there are no siblings - Go to the sibling of the parent and continue
    // this process till a non-null node is found or till we run out of nodes.
    if (next == null) {
      do {
        next = this.current.nextSibling;
        if (next == null) {
          this.current = this.current.parentNode;
        }
      } while (next == null && this.current != null);
    }
    this.current = next;

    // Mark the returned node as a rehydrated node so that we don't try to add
    // it to the parent.
    last['__REHYDRATED__'] = true; 
    return last;
  }

  createComment(data: string): RComment {
    if (this.current && this.current.nodeType === Node.COMMENT_NODE) {
      return (this.getCurrentNodeAndAdvance() as RComment);
    } else {
      console.warn('Did not find comment');
      return document.createComment(data);
    }
  }

  createElement(tagName: string): RElement {
    if (this.current
        && this.current.nodeType === Node.ELEMENT_NODE
        && (this.current as Element).tagName === tagName.toUpperCase()) {
      return (this.getCurrentNodeAndAdvance() as any as RElement);
    } else {
      console.warn('Did not find element ', tagName);
      return document.createElement(tagName);
    }
  }

  createElementNS(namespace: string, tagName: string): RElement {
    if (this.current
        && this.current.nodeType === Node.ELEMENT_NODE
        && (this.current as Element).tagName === tagName
        && (this.current as Element).namespaceURI === namespace) {
      return (this.getCurrentNodeAndAdvance() as any as RElement);
    } else {
      console.warn('Did not find element ', tagName, namespace);
      return document.createElementNS(namespace, tagName) as any as RElement;
    }
  }

  createTextNode(data: string): RText {
    if (this.current && this.current.nodeType === Node.TEXT_NODE) {
      return (this.getCurrentNodeAndAdvance() as RText);
    } else {
      console.warn('Did not find text');
      return document.createTextNode(data);
    }
  }

  querySelector(selectors: string): RElement {
    /** TODO: Why can't Element be assigned to RElement? */
    return document.querySelector(selectors) as any;
  }
}

const RehydrationRendererFactory: RendererFactory3 = {
  createRenderer: (hostElement: RElement, rendererType: RendererType2): Renderer3 => {
    if (hostElement == null) {
      return document;
    }
    return RehydrationRenderer.create(hostElement);
  }
}

let patched = false;
let oldAppendChild: (<T extends Node>(child: T) => T)|null = null;
function patchAppendChild() {
  if (patched) {
    return;
  }
  oldAppendChild = Element.prototype.appendChild;
  Element.prototype.appendChild = <T extends Node>(child: T): T => {
    if (child['__REHYDRATED__']) {
      return child;
    }
    return oldAppendChild.call(this, child);
  };
  patched = true;
}

function unpatchAppendChild() {
  if (!patched) {
    return;
  }
  Element.prototype.appendChild = oldAppendChild;
  oldAppendChild = null;
  patched = false;
}

// Patch appendChild so that when an existing rehydrated
// node is appended to it's parent - Just ignore the operation.
// In the future instead of patching we should have a way to signal to Ivy that
// a node is rehydrated and that it shouldn't try to append it.
patchAppendChild();
renderComponent(AppComponent, {rendererFactory: RehydrationRendererFactory});
unpatchAppendChild();
