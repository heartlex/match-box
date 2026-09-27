import { describe, expect, it } from 'vitest';
import { AccordionState } from '../../../src/core/state/index.ts';

function accordion(multiple = false): AccordionState {
  const state = new AccordionState({ multiple });
  state.setItems(['a', 'b', 'c']);
  return state;
}

describe('AccordionState', () => {
  it('single mode: opening an item closes the others', () => {
    const state = accordion();
    state.open('a');
    state.open('b');
    expect([...state.openKeys]).toEqual(['b']);
  });

  it('multiple mode: items open independently', () => {
    const state = accordion(true);
    state.open('a');
    state.open('c');
    expect([...state.openKeys]).toEqual(['a', 'c']);
    state.toggle('a');
    expect([...state.openKeys]).toEqual(['c']);
  });

  it('ignores unknown keys and notifies only on change', () => {
    const state = accordion();
    let count = 0;
    state.subscribe(() => (count += 1));
    state.open('zzz');
    state.close('a');
    state.open('a');
    state.open('a');
    expect(count).toBe(1);
    expect(state.isOpen('a')).toBe(true);
  });

  it('setItems drops open keys that are gone and ignores equal lists', () => {
    const state = accordion(true);
    state.open('a');
    state.open('b');
    let count = 0;
    state.subscribe(() => (count += 1));
    state.setItems(['a', 'b', 'c']);
    expect(count).toBe(0);
    state.setItems(['b', 'c']);
    expect([...state.openKeys]).toEqual(['b']);
  });

  it('turning multiple off keeps only the first open item in order', () => {
    const state = accordion(true);
    state.open('c');
    state.open('b');
    state.setMultiple(false);
    expect(state.multiple).toBe(false);
    expect([...state.openKeys]).toEqual(['b']);
  });
});
