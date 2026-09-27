import { describe, expect, it } from 'vitest';
import { DisclosureState } from '../../../src/core/state/index.ts';

describe('DisclosureState', () => {
  it('starts collapsed unless told otherwise', () => {
    expect(new DisclosureState().expanded).toBe(false);
    expect(new DisclosureState({ expanded: true }).expanded).toBe(true);
  });

  it('open, close, and toggle notify only on change', () => {
    const state = new DisclosureState();
    let count = 0;
    state.subscribe(() => (count += 1));
    state.close();
    state.open();
    state.open();
    state.toggle();
    expect(count).toBe(2);
    expect(state.expanded).toBe(false);
  });
});
