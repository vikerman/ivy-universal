// Normalizes percent-encoded values in `path` to upper-case and decodes percent-encoded
// values that are not reserved (i.e., unicode characters, emoji, etc). The reserved
// chars are "/" and "%".
// Safe to call multiple times on the same path.
export function normalizePath(path: string): string {
  return path.split("/")
             .map(normalizeSegment)
             .join("/");
}

// We want to ensure the characters "%" and "/" remain in percent-encoded
// form when normalizing paths, so replace them with their encoded form after
// decoding the rest of the path
const SEGMENT_RESERVED_CHARS = /%|\//g;
export function normalizeSegment(segment: string) {
  if (segment.length < 3 || segment.indexOf("%") === -1) return segment;
  return decodeURIComponent(segment).replace(SEGMENT_RESERVED_CHARS, encodeURIComponent);
}
