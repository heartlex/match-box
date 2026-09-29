import { CheckboxGroupState } from '../state/checkbox-group.ts';
import { AttributeWriter } from './attribute-writer.ts';
import type { Behavior } from './behavior.ts';

/** The message a required group shows with nothing checked. */
export const checkboxGroupRequiredMessage = 'Select at least one option.';

export interface CheckboxGroupElements {
  /** Groups the checkboxes. A `<fieldset>` with a `<legend>` is recommended; anything else gets `role="group"`. */
  root: HTMLElement;
  /** An optional "select all" checkbox. */
  parent?: HTMLInputElement | null;
  /** The item checkboxes, in order. */
  items: () => readonly HTMLInputElement[];
}

export interface AttachCheckboxGroupOptions {
  /** Supply to share state. */
  state?: CheckboxGroupState;
  /** At least one item must be checked. */
  required?: boolean;
}

/**
 * Checkbox group behavior for native checkboxes: keeps the parent's
 * `checked` and `indeterminate` in sync with the items, checks or unchecks
 * every enabled item when the parent is activated, and, when required,
 * reports "at least one" through `setCustomValidity` on the first item. It
 * re-reads the items after their form resets.
 */
export function attachCheckboxGroup(
  elements: CheckboxGroupElements,
  options: AttachCheckboxGroupOptions = {},
): Behavior<CheckboxGroupState> {
  const { root, parent = null, items } = elements;
  const state = options.state ?? new CheckboxGroupState({ required: options.required ?? false });
  if (options.state && options.required !== undefined) state.setRequired(options.required);
  const writer = new AttributeWriter();
  const controller = new AbortController();
  const { signal } = controller;

  const read = (): void => {
    state.setItems(
      items().map((input, index) => ({ key: String(index), checked: input.checked, disabled: input.disabled })),
    );
  };

  const render = (): void => {
    const inputs = items();
    state.items.forEach((item, index) => {
      const input = inputs[index];
      if (input) input.checked = item.checked;
    });
    if (parent) {
      parent.checked = state.parentState === 'checked';
      parent.indeterminate = state.parentState === 'mixed';
    }
    inputs.forEach((input, index) => {
      input.setCustomValidity(index === 0 && state.valueMissing ? checkboxGroupRequiredMessage : '');
    });
    writer.write(root, { role: root.localName === 'fieldset' ? null : 'group' });
  };

  root.addEventListener(
    'change',
    (event) => {
      if (event.target !== parent) read();
    },
    { signal },
  );
  parent?.addEventListener(
    'change',
    () => {
      state.toggleAll();
      // The parent toggled natively; draw it from the state even when nothing changed.
      render();
    },
    { signal },
  );

  // The reset event fires before the controls are reset: read them after.
  (items()[0]?.form ?? root.closest('form'))?.addEventListener(
    'reset',
    () => {
      setTimeout(() => {
        if (signal.aborted) return;
        read();
        render();
      });
    },
    { signal },
  );

  const unsubscribe = state.subscribe(render);
  read();
  render();

  return {
    state,
    sync() {
      read();
      render();
    },
    dispose() {
      controller.abort();
      unsubscribe();
      writer.releaseAll();
      for (const input of items()) input.setCustomValidity('');
    },
  };
}
