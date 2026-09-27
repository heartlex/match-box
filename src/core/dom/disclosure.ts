import { DisclosureState } from '../state/disclosure.ts';
import { AttributeWriter } from './attribute-writer.ts';
import type { Behavior } from './behavior.ts';

export interface DisclosureElements {
  /** Toggles the panel. A `<button>` is recommended. */
  trigger: HTMLElement;
  /** Shown and hidden by the template, never by this behavior. */
  panel: HTMLElement;
}

export interface AttachDisclosureOptions {
  /** Supply to share state or set the initial value. */
  state?: DisclosureState;
}

/**
 * Disclosure (show/hide) behavior.
 *
 * Writes on the trigger: `aria-expanded`, `ariaControlsElements`, and, when
 * the trigger is not a `<button>`, `role="button"` and `tabindex="0"`.
 * Writes nothing on the panel: the template shows and hides it from
 * `state.expanded`.
 */
export function attachDisclosure(
  elements: DisclosureElements,
  options: AttachDisclosureOptions = {},
): Behavior<DisclosureState> {
  const { trigger, panel } = elements;
  const state = options.state ?? new DisclosureState();
  const writer = new AttributeWriter();
  const controller = new AbortController();
  const { signal } = controller;
  const native = trigger.localName === 'button';

  const render = (): void => {
    writer.write(trigger, {
      'aria-expanded': String(state.expanded),
      role: native ? null : 'button',
      tabindex: native ? null : '0',
    });
    writer.writeReferences(trigger, { ariaControlsElements: [panel] });
  };

  trigger.addEventListener('click', () => state.toggle(), { signal });
  if (!native) {
    trigger.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        state.toggle();
      },
      { signal },
    );
  }

  const unsubscribe = state.subscribe(render);
  render();

  return {
    state,
    sync: render,
    dispose() {
      controller.abort();
      unsubscribe();
      writer.releaseAll();
    },
  };
}
