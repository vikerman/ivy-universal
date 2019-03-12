// tslint:disable:no-any too much patching.
interface ElementConstructor {
  new(...args: Array<{}>): HTMLElement;
}

/**
 * A very simplified CustomElementsRegistry to maintain tag to constructor
 * mapping
 * TODO: Implement `whenDefined`.
 */
class CustomElementsRegistry {
  private registry = new Map<string, ElementConstructor>();

  // Mapping of prototype to custom element name.
  private reverseRegistry = new Map<{}, string>();

  define(name: string, constructor: ElementConstructor) {
    this.registry.set(name, constructor);
    this.reverseRegistry.set(constructor.prototype, name);
  }

  get(name: string) {
    return this.registry.get(name);
  }

  getName(proto: {}) {
    return this.reverseRegistry.get(proto);
  }
}

// Should match
// domino/lib/MutationConstants.js
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

function nextTick(fn: () => void) {
  Promise.resolve(null).then(fn);
}

function callConnectedCallback(node: HTMLElement) {
  if (typeof (node as any)['connectedCallback'] === 'function') {
    nextTick(() => ((node as any)['connectedCallback'] as Function).call(node, node));
  }
}

function callAttributeChangedCallback(
    clss: {}, target: HTMLElement, attr: {name: string},
    newValue: string|undefined) {
  if ((clss as any)['observedAttributes'] == null) {
    return;
  }
  if ((clss as any)['observedAttributes'].indexOf(attr.name) > -1 &&
      typeof (target as any)['attributeChangedCallback'] === 'function') {
    /* TODO: old value is always undefined since Domino doesn't
     * provide that. But Angular Elements doesn't use old value.
     */
    (target as any)['attributeChangedCallback']!.call(
        target, attr.name, undefined, newValue);
  }
}

function upgradeNode(node: HTMLElement) {
  const doc = (node.ownerDocument as any);
  const customElements: CustomElementsRegistry = doc.__ce__;
  const localName = node.localName;
  const clss: ElementConstructor|undefined =
      localName != null ? customElements.get(localName) : undefined;
  const name = customElements.getName(Object.getPrototypeOf(node));
  let upgraded = false;

  // Check if it's a custom element node that was new-ed directly.
  if (name != null && (node as any).__ceClass__ == null) {
    const clss = customElements.get(name)!;
    (node as any).__ceClass__ = clss;

    (node as any).localName = name;
    (node as any).tagName = name.toUpperCase();

    // Call the attributeChanged callback for each attribute that already
    // exists.
    const attrs = Array.from(node.attributes);
    for (const attr of attrs) {
      callAttributeChangedCallback(
          clss, node, attr, node.getAttribute(attr.name)!);
    }
    upgraded = true;
  }

  // Upgrade nodes that have been created through `createElement`.
  if (localName != null && clss != null && (node as any).__ceClass__ == null) {
    // Upgrade node to custom element.
    const instance = new clss();

    // Copy all properties of the custom element on top of the existing ones
    // in the node.
    for (const k in instance) {
      if (!node.hasOwnProperty(k)) {
        (node as any)[k] = (instance as any)[k];
      }
    }
    // Store the Custom Elements class to check the observedAttributes static
    // field on attribute change.
    (node as any).__ceClass__ = clss;

    // Change the prototype of the node to that of the custom element.
    (Object as any).setPrototypeOf(node, clss.prototype);

    // Call the attributeChanged callback for each attribute that already
    // exists.
    const attrs = Array.from(node.attributes);
    for (const attr of attrs) {
      callAttributeChangedCallback(
          clss, node, attr, node.getAttribute(attr.name)!);
    }

    upgraded = true;
  }

  if (upgraded) {
    callConnectedCallback(node);
  }
}

function callDisconnectedCallback(node: HTMLElement) {
  if (typeof (node as any)['disconnectedCallback'] === 'function') {
    nextTick(() => (node as any)['disconnectedCallback'].call(node));
  }
}

function recursivelyRoot(node: HTMLElement) {
  upgradeNode(node);
  for (let kid: Node|null = node.firstChild; kid !== null;
       kid = kid.nextSibling) {
    recursivelyRoot(kid as HTMLElement);
  }
}

function recursivelyUproot(node: HTMLElement) {
  callDisconnectedCallback(node);

  for (let kid: Node|null = node.firstChild; kid !== null;
       kid = kid.nextSibling) {
    recursivelyUproot(kid as HTMLElement);
  }
}

/**
 * Patch a Document object to support upgrading known custom elements when they
 * are created.
 */
export function patchDocument(doc: Document) {
  if ((doc as any).__ce__) {
    return;
  }
  (doc as any).__ce__ = new CustomElementsRegistry();
  // Hook up to Domino mutation handler to listen to mutation events and call
  // the appropriate custom elements callback.
  const oldMutationHandler = (doc as any).mutationHandler;
  (doc as any)._setMutationHandler((event: DominoMutationEvent) => {
    const target = event.target;
    const node = event.node!;
    switch (event.type) {
      case MutationType.INSERT:
        recursivelyRoot(node);
        break;
      case MutationType.REMOVE:
        recursivelyUproot(node);
        break;
      case MutationType.ATTR:
      case MutationType.REMOVE_ATTR:
        const attr = event.attr!;
        const clss = target.__ceClass__;
        const newValue =
            event.type === MutationType.ATTR ? attr.data : undefined;

        if (clss) {
          callAttributeChangedCallback(clss, target, attr, newValue);
        }
        break;
      default:
        // Do nothing.
    }
    if (oldMutationHandler) {
      oldMutationHandler(event);
    }
  });
}