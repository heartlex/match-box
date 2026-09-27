import type { LitElement } from 'lit';
import type { Constructor } from './constructor.ts';

/**
 * Sets `delegatesFocus: true` on the shadow root, so focusing the host or
 * clicking a non-focusable part of it focuses the first focusable element
 * inside. Adds no instance members.
 */
export function DelegatesFocus<T extends Constructor<LitElement>>(Base: T): T {
  const base = Base as unknown as typeof LitElement;
  class DelegatesFocusElement extends Base {
    static shadowRootOptions: ShadowRootInit = { ...base.shadowRootOptions, delegatesFocus: true };
  }
  return DelegatesFocusElement;
}
