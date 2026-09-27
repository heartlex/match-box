import { describe, expect, it } from 'vitest';
import { ListboxState, type ListboxItem, type Timers } from '../../../src/core/state/index.ts';

const fruit: ListboxItem[] = [
  { key: 'apple', label: 'Apple' },
  { key: 'banana', label: 'Banana' },
  { key: 'cherry', label: 'Cherry', disabled: true },
  { key: 'date', label: 'Date' },
  { key: 'blueberry', label: 'Blueberry' },
];

/** Timers that fire only when `flush()` is called. */
function fakeTimers(): Timers & { flush(): void; pending(): number } {
  const callbacks = new Map<number, () => void>();
  let next = 0;
  return {
    set(callback) {
      next += 1;
      callbacks.set(next, callback);
      return next;
    },
    clear(handle) {
      callbacks.delete(handle as number);
    },
    flush() {
      for (const callback of callbacks.values()) callback();
      callbacks.clear();
    },
    pending: () => callbacks.size,
  };
}

function listbox(options: { multiple?: boolean; items?: ListboxItem[] } = {}): ListboxState {
  const state = new ListboxState({ multiple: options.multiple ?? false, timers: fakeTimers() });
  state.setItems(options.items ?? fruit);
  return state;
}

describe('ListboxState navigation', () => {
  it('activates the first enabled option when items are set', () => {
    const state = listbox({ items: [{ key: 'x', label: 'X', disabled: true }, ...fruit] });
    expect(state.activeIndex).toBe(1);
  });

  it('has no active option when every option is disabled or there are none', () => {
    expect(listbox({ items: [] }).activeIndex).toBe(-1);
    const state = listbox({ items: [{ key: 'x', label: 'X', disabled: true }] });
    expect(state.activeIndex).toBe(-1);
    state.moveNext();
    state.moveLast();
    state.selectActive();
    expect(state.activeIndex).toBe(-1);
    expect(state.selected.size).toBe(0);
  });

  it('moveNext and movePrev skip disabled options and stop at the ends', () => {
    const state = listbox();
    state.moveNext();
    state.moveNext();
    expect(state.activeIndex).toBe(3);
    state.movePrev();
    expect(state.activeIndex).toBe(1);
    state.movePrev();
    state.movePrev();
    expect(state.activeIndex).toBe(0);
    state.moveLast();
    state.moveNext();
    expect(state.activeIndex).toBe(4);
  });

  it('moveFirst and moveLast skip disabled ends', () => {
    const items = [{ key: 'a', label: 'A', disabled: true }, { key: 'b', label: 'B' }, { key: 'c', label: 'C', disabled: true }];
    const state = listbox({ items });
    state.moveLast();
    expect(state.activeIndex).toBe(1);
    state.moveFirst();
    expect(state.activeIndex).toBe(1);
  });

  it('moveTo ignores disabled and out-of-range indices', () => {
    const state = listbox();
    state.moveTo(2);
    state.moveTo(99);
    state.moveTo(-1);
    expect(state.activeIndex).toBe(0);
    state.moveTo(3);
    expect(state.activeIndex).toBe(3);
  });

  it('notifies once per change and not at all for no-ops', () => {
    const state = listbox();
    let count = 0;
    state.subscribe(() => (count += 1));
    state.movePrev();
    state.moveFirst();
    state.moveNext();
    expect(count).toBe(1);
  });
});

describe('ListboxState selection', () => {
  it('single mode replaces the selection', () => {
    const state = listbox();
    state.selectActive();
    state.moveNext();
    state.selectActive();
    expect([...state.selected]).toEqual(['banana']);
    state.toggleActive();
    expect([...state.selected]).toEqual(['banana']);
  });

  it('multiple mode adds with selectActive and flips with toggleActive', () => {
    const state = listbox({ multiple: true });
    state.selectActive();
    state.moveNext();
    state.toggleActive();
    expect([...state.selected]).toEqual(['apple', 'banana']);
    state.toggleActive();
    expect([...state.selected]).toEqual(['apple']);
  });

  it('setSelected replaces the selection and keeps one key in single mode', () => {
    const single = listbox();
    single.setSelected(['date', 'apple']);
    expect([...single.selected]).toEqual(['date']);
    const multi = listbox({ multiple: true });
    multi.setSelected(['date', 'apple']);
    expect([...multi.selected]).toEqual(['date', 'apple']);
  });
});

describe('ListboxState setMultiple', () => {
  it('turning multiple off keeps the first selected option in option order', () => {
    const state = listbox({ multiple: true });
    state.setSelected(['date', 'banana']);
    state.setMultiple(false);
    expect(state.multiple).toBe(false);
    expect([...state.selected]).toEqual(['banana']);
  });

  it('turning multiple on lets selectActive add to the selection', () => {
    const state = listbox();
    state.selectActive();
    state.setMultiple(true);
    state.moveNext();
    state.selectActive();
    expect([...state.selected]).toEqual(['apple', 'banana']);
  });

  it('notifies only on change', () => {
    const state = listbox();
    let count = 0;
    state.subscribe(() => (count += 1));
    state.setMultiple(false);
    state.setMultiple(true);
    expect(count).toBe(1);
  });
});

describe('ListboxState setItems', () => {
  it('does nothing when the items are equal', () => {
    const state = listbox();
    let count = 0;
    state.subscribe(() => (count += 1));
    state.setItems(fruit.map((item) => ({ ...item })));
    expect(count).toBe(0);
  });

  it('keeps the active option by key when it moves', () => {
    const state = listbox();
    state.moveTo(3);
    state.setItems([fruit[3], fruit[0]]);
    expect(state.activeItem?.key).toBe('date');
    expect(state.activeIndex).toBe(0);
  });

  it('falls back to the option now at the old position, clamped to the end', () => {
    const state = listbox();
    state.moveTo(3);
    state.selectActive();
    state.moveTo(4);
    state.setItems(fruit.slice(0, 4));
    expect(state.activeItem?.key).toBe('date');
    state.setItems([{ key: 'kiwi', label: 'Kiwi' }]);
    expect(state.activeItem?.key).toBe('kiwi');
  });

  it('keeps selected keys while their options are filtered out', () => {
    const state = listbox({ multiple: true });
    state.setSelected(['apple', 'date']);
    state.setItems(fruit.slice(0, 2));
    state.setItems(fruit);
    expect([...state.selected]).toEqual(['apple', 'date']);
  });

  it('falls back to the nearest enabled option when the active one is removed', () => {
    const state = listbox();
    state.moveTo(3);
    state.setItems(fruit.filter((item) => item.key !== 'date'));
    expect(state.activeItem?.key).toBe('blueberry');
  });

  it('moves off an option that became disabled', () => {
    const state = listbox();
    state.moveTo(1);
    state.setItems(fruit.map((item) => (item.key === 'banana' ? { ...item, disabled: true } : item)));
    expect(state.activeItem?.key).toBe('date');
  });
});

describe('ListboxState typeahead', () => {
  it('matches label prefixes case-insensitively and skips disabled options', () => {
    const state = listbox();
    state.typeahead('C');
    expect(state.activeIndex).toBe(0);
    state.typeahead('d');
    expect(state.activeIndex).toBe(0);
  });

  it('builds a multi-character query until the timer fires', () => {
    const timers = fakeTimers();
    const state = new ListboxState({ timers });
    state.setItems(fruit);
    state.typeahead('b');
    state.typeahead('l');
    expect(state.activeItem?.key).toBe('blueberry');
    expect(state.typeaheadBuffer).toBe('bl');
    timers.flush();
    expect(state.typeaheadBuffer).toBe('');
    state.typeahead('d');
    expect(state.activeItem?.key).toBe('date');
  });

  it('cycles through options when the same character repeats', () => {
    const state = listbox();
    state.typeahead('b');
    expect(state.activeItem?.key).toBe('banana');
    state.typeahead('b');
    expect(state.activeItem?.key).toBe('blueberry');
    state.typeahead('b');
    expect(state.activeItem?.key).toBe('banana');
  });

  it('keeps one pending timer and resets it on each character', () => {
    const timers = fakeTimers();
    const state = new ListboxState({ timers });
    state.setItems(fruit);
    state.typeahead('a');
    state.typeahead('p');
    expect(timers.pending()).toBe(1);
  });

  it('includes spaces in the query', () => {
    const state = listbox({ items: [{ key: 'a', label: 'Red apple' }, { key: 'b', label: 'Red berry' }] });
    for (const char of 'red b') state.typeahead(char);
    expect(state.activeItem?.key).toBe('b');
  });
});
