export function isNode() {
  return !isBrowser();
}

export function isBrowser() {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

export function getComponentId(doc: Document, name: string) {
  // Look for it in the known list.
  const d: Document & {_seenElements: Map<string, number>; _nextCompId: number } = doc as any;
  if (d._seenElements.has(name)) {
    return d._seenElements.get(name);
  }
  const compId = d._nextCompId++;
  d._seenElements.set(name, compId);
  return compId;
}
