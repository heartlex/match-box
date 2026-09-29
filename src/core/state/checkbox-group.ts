import { Store } from './store.ts';

/** One checkbox in a group. */
export interface CheckboxGroupItem {
  key: string;
  checked: boolean;
  disabled: boolean;
}

/** The state a "select all" checkbox shows. */
export type CheckboxGroupParentState = 'checked' | 'unchecked' | 'mixed';

export interface CheckboxGroupStateOptions {
  /** At least one item must be checked. */
  required?: boolean;
}

/** Checked state of a group of checkboxes, with a derived "select all" state. */
export class CheckboxGroupState extends Store {
  #items: readonly CheckboxGroupItem[] = [];
  #required: boolean;

  constructor(options: CheckboxGroupStateOptions = {}) {
    super();
    this.#required = options.required ?? false;
  }

  get items(): readonly CheckboxGroupItem[] {
    return this.#items;
  }

  get required(): boolean {
    return this.#required;
  }

  get checkedKeys(): string[] {
    return this.#items.filter((item) => item.checked).map((item) => item.key);
  }

  /** From enabled items only; `unchecked` when there are none. */
  get parentState(): CheckboxGroupParentState {
    const enabled = this.#items.filter((item) => !item.disabled);
    const checked = enabled.filter((item) => item.checked).length;
    if (checked === 0) return 'unchecked';
    return checked === enabled.length ? 'checked' : 'mixed';
  }

  /** Required and nothing checked. */
  get valueMissing(): boolean {
    return this.#required && !this.#items.some((item) => item.checked);
  }

  setRequired(required: boolean): void {
    if (required === this.#required) return;
    this.#required = required;
    this.notify();
  }

  /** Replaces the items, for example after reading them from the DOM. */
  setItems(items: readonly CheckboxGroupItem[]): void {
    const same =
      items.length === this.#items.length &&
      items.every((item, index) => {
        const current = this.#items[index];
        return (
          current !== undefined &&
          current.key === item.key &&
          current.checked === item.checked &&
          current.disabled === item.disabled
        );
      });
    if (same) return;
    this.#items = items.map((item) => ({ ...item }));
    this.notify();
  }

  /** A user toggle: ignored for unknown and disabled items. */
  setChecked(key: string, checked: boolean): void {
    const current = this.#items.find((item) => item.key === key);
    if (current === undefined || current.disabled || current.checked === checked) return;
    this.#items = this.#items.map((item) => (item === current ? { ...item, checked } : item));
    this.notify();
  }

  /** Checks every enabled item, or unchecks them all when all are checked. */
  toggleAll(): void {
    const checked = this.parentState !== 'checked';
    let changed = false;
    this.#items = this.#items.map((item) => {
      if (item.disabled || item.checked === checked) return item;
      changed = true;
      return { ...item, checked };
    });
    if (changed) this.notify();
  }
}
