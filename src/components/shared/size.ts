/** The three sizes. Every size is five tokens in tokens.css. */
export const sizes = ['sm', 'md', 'lg'] as const;

export type Size = (typeof sizes)[number];

/** Returns `value` if it is a size, otherwise `md`. */
export function sizeName(value: string | null | undefined): Size {
  return sizes.find((size) => size === value) ?? 'md';
}
