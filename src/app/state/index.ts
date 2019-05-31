/** THIS FILE SHOULD BE AUTO-GENERATED. */

import { StoreDef, STORE, Store } from '../../lib/store';

/**
 * Metadata for the store used to decide when to load which store module.
 */
export const storeDef: StoreDef = {
  'add-to-cart': ['cart'],
}

function loadStoreModule(module: string) {
  switch (module) {
    case 'cart':
      return import('./store/cart');
    default:
      throw new Error(`Unknown store module ${module}`);
  }
}

export function initStore(doc: Document) {
  doc[STORE] = new Store(doc, storeDef, loadStoreModule);
}
