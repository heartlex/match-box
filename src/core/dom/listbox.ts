import { ListboxState, type ListboxItem, type ListboxStateOptions } from '../state/listbox.ts';
import { AttributeWriter } from './attribute-writer.ts';
import type { Behavior } from './behavior.ts';

export interface ListboxElements {
  /** The listbox container. Must stay the same element while attached. */
  root: HTMLElement;
  /** Current option elements in order. Read on attach and on every `sync()`. */
  items: () => readonly HTMLElement[];
  /** Labels the listbox. */
  label?: HTMLElement;
}

/**
 * How focus follows the active option. Only roving tabindex ships in v1;
 * `aria-activedescendant` will be added here for the v2 combobox.
 */
export type ListboxFocusStrategy = 'roving';

export interface AttachListboxOptions extends ListboxStateOptions {
  /** Supply to share state. When given, the state options above are ignored. */
  state?: ListboxState;
  focusStrategy?: ListboxFocusStrategy;
  /** Turns an option element into state data. Defaults to {@link describeOption}. */
  describeItem?: (element: HTMLElement, index: number) => ListboxItem;
}

/**
 * Default option description: key from `data-value` (else the index),
 * label from the text content, disabled from `data-disabled`.
 */
export function describeOption(element: HTMLElement, index: number): ListboxItem {
  return {
    key: element.dataset['value'] ?? String(index),
    label: element.textContent?.trim() ?? '',
    disabled: element.hasAttribute('data-disabled'),
  };
}

/**
 * Listbox behavior with roving tabindex, single or multiple selection,
 * typeahead, and disabled options.
 *
 * Writes on the root: `role="listbox"`, `aria-multiselectable` (multiple
 * mode), `ariaLabelledByElements` (when a label is given).
 * Writes on each option: `role="option"`, `aria-selected`, `aria-disabled`,
 * `tabindex`. In single mode `aria-selected` is present only on the selected
 * option; in multiple mode it is `"true"` or `"false"` on every option.
 */
export function attachListbox(
  elements: ListboxElements,
  options: AttachListboxOptions = {},
): Behavior<ListboxState> {
  const { root, items, label } = elements;
  const state = options.state ?? new ListboxState(options);
  const describe = options.describeItem ?? describeOption;
  const writer = new AttributeWriter();
  const controller = new AbortController();
  const { signal } = controller;
  let current: readonly HTMLElement[] = [];

  const render = (): void => {
    writer.retain([root, ...current]);
    writer.write(root, {
      role: 'listbox',
      'aria-multiselectable': state.multiple ? 'true' : null,
    });
    writer.writeReferences(root, { ariaLabelledByElements: label ? [label] : null });
    current.forEach((element, index) => {
      const item = state.items[index];
      const selected = item !== undefined && state.selected.has(item.key);
      writer.write(element, {
        role: 'option',
        'aria-selected': state.multiple ? String(selected) : selected ? 'true' : null,
        'aria-disabled': item?.disabled ? 'true' : null,
        tabindex: index === state.activeIndex ? '0' : '-1',
      });
    });
  };

  const sync = (): void => {
    current = [...items()];
    state.setItems(current.map(describe));
    render();
  };

  const focusActive = (): void => {
    current[state.activeIndex]?.focus();
  };

  const select = (): void => {
    if (state.multiple) state.toggleActive();
    else state.selectActive();
  };

  const indexOf = (event: Event): number => {
    const path = event.composedPath();
    return current.findIndex((element) => path.includes(element));
  };

  const handleKey = (key: string): boolean => {
    switch (key) {
      case 'ArrowDown':
        state.moveNext();
        return true;
      case 'ArrowUp':
        state.movePrev();
        return true;
      case 'Home':
        state.moveFirst();
        return true;
      case 'End':
        state.moveLast();
        return true;
      case ' ':
        if (state.typeaheadBuffer !== '') state.typeahead(' ');
        else select();
        return true;
      default:
        if (key.length !== 1) return false;
        state.typeahead(key);
        return true;
    }
  };

  root.addEventListener(
    'keydown',
    (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (!handleKey(event.key)) return;
      event.preventDefault();
      focusActive();
    },
    { signal },
  );

  // Keep focus off disabled options: they have tabindex -1, which a click would focus.
  root.addEventListener(
    'mousedown',
    (event) => {
      const index = indexOf(event);
      if (index !== -1 && state.items[index]?.disabled) event.preventDefault();
    },
    { signal },
  );

  root.addEventListener(
    'click',
    (event) => {
      const index = indexOf(event);
      if (index === -1 || state.items[index]?.disabled) return;
      state.moveTo(index);
      select();
      focusActive();
    },
    { signal },
  );

  const unsubscribe = state.subscribe(render);
  sync();

  return {
    state,
    sync,
    dispose() {
      controller.abort();
      unsubscribe();
      writer.releaseAll();
    },
  };
}
