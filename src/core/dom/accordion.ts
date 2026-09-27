import { AccordionState, type AccordionStateOptions } from '../state/accordion.ts';
import type { DisclosureState } from '../state/disclosure.ts';
import type { Behavior } from './behavior.ts';

/** Anything that exposes a disclosure state: a disclosure `Behavior` or `DisclosureController`. */
export interface DisclosureLike {
  readonly state: DisclosureState;
}

/**
 * Item keys per accordion state. They live as long as the state, not the
 * attach, so a state that outlives a detach (a Lit host that is moved) keeps
 * recognizing its items when it attaches again.
 */
const itemKeys = new WeakMap<AccordionState, { keys: WeakMap<DisclosureState, string>; next: number }>();

export interface AccordionElements {
  /** The accordion's disclosures, in order. Read on attach and on every `sync()`. */
  items: () => readonly DisclosureLike[];
}

export interface AttachAccordionOptions extends AccordionStateOptions {
  /** Supply to share state. When given, `multiple` above is ignored. */
  state?: AccordionState;
}

/**
 * Accordion behavior: coordinates the disclosure states of its items so that,
 * in single mode, opening one closes the others.
 *
 * Writes no attributes. Each item's own disclosure behavior writes its ARIA.
 * On attach, items that are already open count as open; in single mode only
 * the first stays open.
 */
export function attachAccordion(
  elements: AccordionElements,
  options: AttachAccordionOptions = {},
): Behavior<AccordionState> {
  const state = options.state ?? new AccordionState(options);
  let registry = itemKeys.get(state);
  if (registry === undefined) {
    registry = { keys: new WeakMap(), next: 0 };
    itemKeys.set(state, registry);
  }
  const { keys } = registry;
  let current: readonly DisclosureState[] = [];
  let unsubscribeItems: (() => void)[] = [];

  const keyOf = (item: DisclosureState): string => {
    let key = keys.get(item);
    if (key === undefined) {
      registry.next += 1;
      key = String(registry.next);
      keys.set(item, key);
    }
    return key;
  };

  // Push the accordion's open set down to each disclosure.
  const render = (): void => {
    for (const item of current) {
      const open = state.isOpen(keyOf(item));
      if (open && !item.expanded) item.open();
      else if (!open && item.expanded) item.close();
    }
  };

  const sync = (): void => {
    for (const unsubscribe of unsubscribeItems) unsubscribe();
    const previous = new Set(current);
    current = items();
    // Newly seen items that are already open join the open set.
    const newlyOpen = current.filter((item) => !previous.has(item) && item.expanded).map(keyOf);
    state.setItems(current.map(keyOf));
    for (const key of newlyOpen) {
      // In single mode the first open item wins, including one already open before.
      if (!state.multiple && state.openKeys.size > 0) break;
      state.open(key);
    }
    // Pull each disclosure's own changes (user clicks) up into the accordion.
    unsubscribeItems = current.map((item) =>
      item.subscribe(() => {
        if (item.expanded) state.open(keyOf(item));
        else state.close(keyOf(item));
      }),
    );
    render();
  };

  const items = (): readonly DisclosureState[] => elements.items().map((item) => item.state);
  const unsubscribe = state.subscribe(render);
  sync();

  return {
    state,
    sync,
    dispose() {
      unsubscribe();
      for (const unsubscribeItem of unsubscribeItems) unsubscribeItem();
      unsubscribeItems = [];
    },
  };
}
