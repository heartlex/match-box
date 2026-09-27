import { describe, expect, it } from 'vitest';
import { DialogState } from '../../../src/core/state/index.ts';

describe('DialogState', () => {
  it('clears the return value on show, so a dismissal never reports an old value', () => {
    const state = new DialogState();
    let count = 0;
    state.subscribe(() => (count += 1));
    state.show();
    state.show();
    state.close('ok');
    state.close('ignored');
    expect(state.returnValue).toBe('ok');
    state.show();
    expect(state.returnValue).toBe('');
    state.close();
    expect(state.returnValue).toBe('');
    expect(count).toBe(4);
  });
});
