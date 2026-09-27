import { describe, expect, it } from 'vitest';
import { DialogState } from '../../../src/core/state/index.ts';

describe('DialogState', () => {
  it('shows and closes, keeping the last return value when closed without one', () => {
    const state = new DialogState();
    let count = 0;
    state.subscribe(() => (count += 1));
    state.show();
    state.show();
    state.close('ok');
    state.close('ignored');
    expect(state.returnValue).toBe('ok');
    state.show();
    state.close();
    expect(state.returnValue).toBe('ok');
    expect(count).toBe(4);
  });
});
