let counter = 0;

/**
 * Returns an id unique within the page, such as `mb-7`. Client only: ids are
 * not stable across page loads.
 */
export function uniqueId(prefix = 'mb'): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
