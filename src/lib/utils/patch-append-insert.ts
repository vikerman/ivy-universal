const REHYDRATED = '__REHYDRATED__'; // Should match RehydrationRenderer.

let patched = false;
let oldAppendChild: (<T extends Node>(child: T) => T) | null = null;
let oldInsertBefore: (<T extends Node>(child: T, reference: Node) => T) | null = null;

function patchedAppendChild<T extends Node>(child: T): T {
  if (child[REHYDRATED]) {
    return child;
  }
  return oldAppendChild.call(this, child);
};

function patchedInsertBefore<T extends Node>(child: T, reference: Node): T {
  if (child[REHYDRATED]) {
    return child;
  }
  return oldInsertBefore.call(this, child, reference);
};

/**
 * Patch appendChild and insertBefore to ignore rehydrated nodes.
 */
export function patchAppendChildAndInsertBefore() {
  if (patched) {
    return;
  }
  oldAppendChild = Element.prototype.appendChild;
  Element.prototype.appendChild = patchedAppendChild;
  oldInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = patchedInsertBefore;
  patched = true;
}

/**
 * Unpatch appendChild and insertBefore 
 */
export function unpatchAppendChildAndInsertBefore() {
  if (!patched) {
    return;
  }
  Element.prototype.appendChild = oldAppendChild;
  oldAppendChild = null;
  oldInsertBefore = null;
  patched = false;
}
