function isInert(element: Element): boolean {
  for (let node: Element | null = element; node !== null; ) {
    if (node.hasAttribute('inert')) return true;
    const root = node.getRootNode();
    node = node.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
  }
  return false;
}

/** True if `element` takes part in sequential (Tab) focus navigation. */
export function isTabbable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;
  if (element.localName === 'a' && !element.hasAttribute('href') && !element.hasAttribute('tabindex')) {
    return false;
  }
  if ((element as { disabled?: unknown }).disabled === true) return false;
  if (isInert(element)) return false;
  return element.checkVisibility();
}

function childrenOf(node: Element | ShadowRoot | Document): readonly Element[] {
  if (node instanceof HTMLSlotElement) {
    const assigned = node.assignedElements({ flatten: true });
    return assigned.length > 0 ? assigned : [...node.children];
  }
  if (node instanceof Element && node.shadowRoot) return [...node.shadowRoot.children];
  return [...node.children];
}

/**
 * Tabbable elements inside `root`, in sequential focus order. Descends into
 * open shadow roots and follows slot assignment. Positive `tabindex` values
 * come first, in ascending order.
 */
export function tabbables(root: Element | ShadowRoot | Document): HTMLElement[] {
  const found: HTMLElement[] = [];
  const visit = (node: Element | ShadowRoot | Document): void => {
    for (const child of childrenOf(node)) {
      if (child instanceof HTMLElement && isTabbable(child)) found.push(child);
      visit(child);
    }
  };
  visit(root);
  const positive = found.filter((element) => element.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex);
  return [...positive, ...found.filter((element) => element.tabIndex === 0)];
}
