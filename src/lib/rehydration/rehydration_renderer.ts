import { ObjectOrientedRenderer3, RElement, RComment, RText, RendererFactory3, Renderer3 } from '@angular/core/src/render3/interfaces/renderer';
import { getComponentId } from '../utils/utils';

const REHYDRATED = '__REHYDRATED__';
const TEMPLATE_END = '__T_END__'

/**
 * A Renderer3 renderer that matches with existing DOM nodes from prerendering.
 */
class RehydrationRenderer implements ObjectOrientedRenderer3 {
  private current: Node | null = null;

  private templateMode = false;
  private templateNodes: Node[] = [];
  private componentId: number;

  private constructor(private host: RElement, private scoped) {
    const hostEl = (host as any as Element);
    this.current = hostEl.firstChild;

    if (this.scoped) {
      // Get the component id to set for implementing scoped CSS.
      this.componentId = getComponentId(document, hostEl.localName);

      // Set the attribute that will be used by scoped CSS to set host styling.
      hostEl.setAttribute(`_nghost-${this.componentId}`, '');
    }
  }

  private static currentRenderer?: RehydrationRenderer;
  static create(hostElement: RElement, scoped = false) {
    if (this.currentRenderer && this.currentRenderer.host === hostElement) {
      return this.currentRenderer;
    } else {
      return (this.currentRenderer = new RehydrationRenderer(hostElement, scoped));
    }
  }

  // Do a pre-order traversal of the tree
  private getCurrentNodeAndAdvance() {
    if (this.current == null) {
      return null;
    }

    // Try to go one level down.
    const last = this.current;
    let next: Node | null = null;
    if (isBuiltInNode(last)) {
      // TODO: For now only descend to children if it's a standard HTML elements.
      // We don't support content projection for Components/Elements until we
      // get a hook from Ivy to the renderer on `endElement()`.
      next = this.current.firstChild;
    }

    // If there are no nodes below - Go to the next sibling.
    // If there are no siblings - Go to the sibling of the parent and continue
    // this process till a non-null node is found or till we run out of nodes.
    if (next == null) {
      do {
        if (this.current[TEMPLATE_END]) {
          // We are at end of a template section. Go to the next templates
          // section if any.
          next = this.templateNodes.shift();
          break;
        }

        if (this.current === (this.host as any)) {
          // Don't go to the sibling tree of the host element.
          break;
        }

        // Find the next sibling or aunt.
        next = this.current.nextSibling;
        if (next == null) {
          this.current = this.current.parentNode;
        }
      } while (next == null && this.current != null);
    }
    this.current = next;
    if (!this.current && !this.templateMode) {
      // Switch to processing the embedded template nodes if done wth main
      // component.
      this.templateMode = true;
      this.current = this.templateNodes.shift();
    }

    // Mark the returned node as a rehydrated node so that we don't try to add
    // it to the parent.
    last[REHYDRATED] = true;
    return last;
  }

  createComment(data: string): RComment {
    // Comments are used as template markers. Ex. for ngIf, ngFor blocks.
    // When a comment is matched we save all nodes for a later template
    // evaluation.
    if (this.current && this.current.nodeType === Node.COMMENT_NODE &&
      (this.current as Comment).data.startsWith('s')) {
      // <!--s0-->
      //  Template nodes go here
      // <!--e0-->
      // Advance till the matching end comment.
      const comment = this.current as Comment;
      const endData = 'e' + comment.data.substring(1);

      let nodes: Node[] = [];
      let node = this.current.nextSibling;
      while (node &&
        node.nodeType !== Node.COMMENT_NODE &&
        ((node as Comment).data !== endData)) {
        nodes.push(node);
        node = node.nextSibling;
      }

      if (!node) {
        // Something went horribly wrong. Stop hydrating.
        this.templateMode = true;
        this.current = null;
        console.error('Did not find closing template comment');
      }

      if (nodes.length > 0) {
        // Mark the last node as end of the template section.
        nodes[nodes.length - 1][TEMPLATE_END] = true;

        // Push the new nodes at the end of the template nodes.
        // Embedded templates are visited in breadth first mode.
        // So all the sibling templates will be expanded before coming back
        // to this nested template.
        this.templateNodes.push(nodes[0]);
      }

      // Return the end comment as the matching comment.
      this.current = node;
      return (this.getCurrentNodeAndAdvance() as RComment);
    } else {
      // console.warn('Did not find comment');
      return document.createComment(data);
    }
  }

  createElement(localName: string): RElement {
    if (this.current
      && this.current.nodeType === Node.ELEMENT_NODE
      && (this.current as Element).localName === localName) {
        return (this.getCurrentNodeAndAdvance() as any as RElement);
    } else {
      // console.warn('Did not find element ', localName);
      const el = document.createElement(localName);
      if (this.scoped) {
        el.setAttribute(`_ngcontent-${this.componentId}`, '');
      }
      return el;
    }
  }

  createElementNS(namespace: string, localName: string): RElement {
    if (this.current
      && this.current.nodeType === Node.ELEMENT_NODE
      && (this.current as Element).localName === localName
      && (this.current as Element).namespaceURI === namespace) {
      return (this.getCurrentNodeAndAdvance() as any as RElement);
    } else {
      // console.warn('Did not find element ', localName, namespace);
      const el = document.createElementNS(namespace, localName);
      if (this.scoped) {
        el.setAttribute(`_ngcontent-${this.componentId}`, '');
      }
      return el as any as RElement;
    }
  }

  createTextNode(data: string): RText {
    if (this.current && this.current.nodeType === Node.TEXT_NODE) {
      return (this.getCurrentNodeAndAdvance() as RText);
    } else {
      // console.warn('Did not find text');
      return document.createTextNode(data);
    }
  }

  querySelector(selectors: string): RElement {
    // TODO: Why can't Element be assigned to RElement?
    return document.querySelector(selectors) as any;
  }
}

// Rehydration renderer factory that reuses pre-rendered DOM.
export const RehydrationRendererFactory: RendererFactory3 = {
  createRenderer: (hostElement: RElement, rendererType: any): Renderer3 => {
    if (hostElement == null) {
      return document;
    }
    return RehydrationRenderer.create(hostElement, false);
  }
}

// Same as above but with scoped styles.
export const ScopedRehydrationRendererFactory: RendererFactory3 = {
  createRenderer: (hostElement: RElement, rendererType: any): Renderer3 => {
    if (hostElement == null) {
      return document;
    }
    return RehydrationRenderer.create(hostElement, true);
  }
}

function isBuiltInNode(n: Node) {
  if (n.nodeType !== Node.ELEMENT_NODE) {
    return true;
  }

  // If it's an unknown element or known custom element return as not built-in.
  const el: HTMLElement = n as HTMLElement;
  if (el.localName.indexOf('-') > 0 ||
    el.constructor === HTMLUnknownElement ||
    customElements.get(el.localName) != null) {
    return false;
  } else {
    return true;
  }
}
