import { describe, expect, it, vi } from 'vitest';
import { CheckboxGroupState } from '../../../src/core/state/checkbox-group.ts';

const items = (checked: boolean[], disabled: number[] = []) =>
  checked.map((on, index) => ({ key: String(index), checked: on, disabled: disabled.includes(index) }));

describe('CheckboxGroupState', () => {
  it('derives the parent state from enabled items', () => {
    const state = new CheckboxGroupState();
    state.setItems(items([false, false, false]));
    expect(state.parentState).toBe('unchecked');
    state.setItems(items([true, false, false]));
    expect(state.parentState).toBe('mixed');
    state.setItems(items([true, true, false], [2]));
    expect(state.parentState).toBe('checked');
    state.setItems([]);
    expect(state.parentState).toBe('unchecked');
  });

  it('toggleAll checks every enabled item, then unchecks them, never touching disabled ones', () => {
    const state = new CheckboxGroupState();
    state.setItems(items([true, false, false], [2]));
    state.toggleAll();
    expect(state.items.map((item) => item.checked)).toEqual([true, true, false]);
    state.toggleAll();
    expect(state.items.map((item) => item.checked)).toEqual([false, false, false]);
    state.setItems(items([false, true], [1]));
    state.toggleAll();
    expect(state.items.map((item) => item.checked)).toEqual([true, true]);
  });

  it('setChecked changes one enabled item and lists checked keys', () => {
    const state = new CheckboxGroupState();
    state.setItems(items([false, false], [1]));
    state.setChecked('0', true);
    state.setChecked('1', true);
    expect(state.checkedKeys).toEqual(['0']);
  });

  it('reports valueMissing only when required and nothing is checked', () => {
    const state = new CheckboxGroupState({ required: true });
    state.setItems(items([false, false]));
    expect(state.valueMissing).toBe(true);
    state.setChecked('1', true);
    expect(state.valueMissing).toBe(false);
    state.setChecked('1', false);
    state.setRequired(false);
    expect(state.valueMissing).toBe(false);
  });

  it('notifies only on change', () => {
    const state = new CheckboxGroupState();
    const listener = vi.fn();
    state.subscribe(listener);
    state.setItems(items([false]));
    state.setItems(items([false]));
    state.setChecked('0', false);
    state.setChecked('9', true);
    expect(listener).toHaveBeenCalledTimes(1);
    state.toggleAll();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
