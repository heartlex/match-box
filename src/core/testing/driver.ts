/**
 * Real input for a conformance suite. Implement it with your runner's
 * browser commands; synthetic events do not trigger native behavior such as
 * Escape closing a dialog.
 */
export interface Driver {
  /**
   * Presses one key on the focused element. Keys use Playwright names:
   * `ArrowDown`, `ArrowUp`, `Home`, `End`, `Space`, `Enter`, `Escape`, `Tab`,
   * or a single character.
   */
  press(key: string): Promise<void>;
  /** Clicks with a real pointer at the center of `target`, or at viewport coordinates. */
  click(target: Element | { x: number; y: number }): Promise<void>;
}

export type InteractionType = 'keyboard' | 'pointer';

/** Every suite runs once per interaction type. */
export const interactionTypes: readonly InteractionType[] = ['keyboard', 'pointer'];

/** Optional extra check, such as an axe run, called with the pattern's root element. */
export type Audit = (root: Element) => Promise<void>;

export function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

/**
 * True if `node` is `ancestor` or inside it in the flat tree: through slot
 * assignment and out of shadow roots to their hosts.
 */
export function containsComposed(ancestor: Node, node: Node | null): boolean {
  for (let current: Node | null = node; current !== null; ) {
    if (current === ancestor) return true;
    const slot = current instanceof Element ? current.assignedSlot : null;
    current = slot ?? current.parentNode ?? (current instanceof ShadowRoot ? current.host : null);
  }
  return false;
}
