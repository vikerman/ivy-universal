export function isChildComponent(target: any) {
  // TODO: Expose getLContext from @angular/core and use that.

  // Look for patched __ngContext__ property
  const context = target['__ngContext__'];
  if (!context) {
    return false;
  }
  // Check whether the isRoot bit(128) is set in the FLAGS offset(1).
  // If not this is a child component.
  return !((context[1] & 128) === 128);
}
