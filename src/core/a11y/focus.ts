import { deepActiveElement } from './active-element.ts';

/**
 * Records the focused element. The returned function moves focus back to it,
 * if it is still connected.
 */
export function saveFocus(root: Document | ShadowRoot = document): () => void {
  const previous = deepActiveElement(root);
  return () => {
    if ((previous instanceof HTMLElement || previous instanceof SVGElement) && previous.isConnected) {
      previous.focus();
    }
  };
}
