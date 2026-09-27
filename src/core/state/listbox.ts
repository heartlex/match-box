import { Store } from './store.ts';

/** One option as the state sees it. */
export interface ListboxItem {
  /** Stable identity. Selection is stored by key. */
  readonly key: string;
  /** Text matched by typeahead. */
  readonly label: string;
  readonly disabled?: boolean;
}

/** The typeahead reset timer. Inject a fake in tests. */
export interface Timers {
  set(callback: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

export interface ListboxStateOptions {
  /** Allow more than one selected option. Defaults to false. */
  multiple?: boolean;
  /** Milliseconds of inactivity after which the typeahead buffer clears. Defaults to 500. */
  typeaheadTimeout?: number;
  timers?: Timers;
}

const defaultTimers: Timers = {
  set: (callback, ms) => setTimeout(callback, ms),
  clear: (handle) => {
    clearTimeout(handle as ReturnType<typeof setTimeout>);
  },
};

function sameItems(a: readonly ListboxItem[], b: readonly ListboxItem[]): boolean {
  return (
    a.length === b.length &&
    a.every((item, index) => {
      const other = b[index];
      return (
        other !== undefined &&
        item.key === other.key &&
        item.label === other.label &&
        Boolean(item.disabled) === Boolean(other.disabled)
      );
    })
  );
}

/**
 * Active option, selection, and typeahead for a listbox.
 *
 * Navigation skips disabled options and does not wrap. `activeIndex` is -1
 * only when no option is enabled.
 */
export class ListboxState extends Store {
  readonly multiple: boolean;
  #items: readonly ListboxItem[] = [];
  #activeIndex = -1;
  #selected: ReadonlySet<string> = new Set();
  #buffer = '';
  #timer: unknown = undefined;
  readonly #timeout: number;
  readonly #timers: Timers;

  constructor(options: ListboxStateOptions = {}) {
    super();
    this.multiple = options.multiple ?? false;
    this.#timeout = options.typeaheadTimeout ?? 500;
    this.#timers = options.timers ?? defaultTimers;
  }

  get items(): readonly ListboxItem[] {
    return this.#items;
  }

  get activeIndex(): number {
    return this.#activeIndex;
  }

  get activeItem(): ListboxItem | undefined {
    return this.#items[this.#activeIndex];
  }

  /** Keys of the selected options. */
  get selected(): ReadonlySet<string> {
    return this.#selected;
  }

  /** Characters typed since the last typeahead reset. */
  get typeaheadBuffer(): string {
    return this.#buffer;
  }

  /**
   * Replaces the options. Keeps the active option if its key is still present
   * and enabled; otherwise activates the first selected enabled option, then
   * the first enabled one. Drops selected keys that are no longer present.
   * Does nothing when the new list equals the current one.
   */
  setItems(items: readonly ListboxItem[]): void {
    if (sameItems(this.#items, items)) return;
    const activeKey = this.activeItem?.key;
    this.#items = [...items];
    const keys = new Set(items.map((item) => item.key));
    this.#selected = new Set([...this.#selected].filter((key) => keys.has(key)));
    const kept = items.findIndex((item) => item.key === activeKey && !item.disabled);
    this.#activeIndex = kept !== -1 ? kept : this.#initialIndex();
    this.notify();
  }

  /** Replaces the selection. In single mode only the first key is kept. */
  setSelected(keys: Iterable<string>): void {
    const next = [...keys].slice(0, this.multiple ? undefined : 1);
    if (next.length === this.#selected.size && next.every((key) => this.#selected.has(key))) return;
    this.#selected = new Set(next);
    this.notify();
  }

  moveNext(): void {
    this.#activate(this.#findEnabled(this.#activeIndex + 1, 1));
  }

  movePrev(): void {
    this.#activate(this.#findEnabled(this.#activeIndex - 1, -1));
  }

  moveFirst(): void {
    this.#activate(this.#findEnabled(0, 1));
  }

  moveLast(): void {
    this.#activate(this.#findEnabled(this.#items.length - 1, -1));
  }

  /** Activates the option at `index` if it exists and is enabled. */
  moveTo(index: number): void {
    const item = this.#items[index];
    if (item !== undefined && !item.disabled) this.#activate(index);
  }

  /** Single mode: selects only the active option. Multiple mode: adds it. */
  selectActive(): void {
    const item = this.activeItem;
    if (item === undefined || item.disabled) return;
    if (this.#selected.has(item.key) && (this.multiple || this.#selected.size === 1)) return;
    this.#selected = this.multiple ? new Set([...this.#selected, item.key]) : new Set([item.key]);
    this.notify();
  }

  /** Multiple mode: flips the active option. Single mode: same as `selectActive`. */
  toggleActive(): void {
    if (!this.multiple) {
      this.selectActive();
      return;
    }
    const item = this.activeItem;
    if (item === undefined || item.disabled) return;
    const next = new Set(this.#selected);
    if (next.has(item.key)) next.delete(item.key);
    else next.add(item.key);
    this.#selected = next;
    this.notify();
  }

  /**
   * Adds `char` to the buffer and activates the next enabled option whose
   * label starts with it. Repeating one character cycles through the options
   * starting with that character.
   */
  typeahead(char: string): void {
    if (this.#timer !== undefined) this.#timers.clear(this.#timer);
    this.#timer = this.#timers.set(() => {
      this.#buffer = '';
      this.#timer = undefined;
    }, this.#timeout);
    this.#buffer += char.toLowerCase();
    const first = this.#buffer.charAt(0);
    const repeated = [...this.#buffer].every((c) => c === first);
    const query = repeated ? first : this.#buffer;
    const start = repeated ? this.#activeIndex + 1 : this.#activeIndex;
    const count = this.#items.length;
    for (let offset = 0; offset < count; offset++) {
      const index = (((start + offset) % count) + count) % count;
      const item = this.#items[index];
      if (item !== undefined && !item.disabled && item.label.toLowerCase().startsWith(query)) {
        this.#activate(index);
        return;
      }
    }
  }

  #initialIndex(): number {
    const selected = this.#items.findIndex((item) => this.#selected.has(item.key) && !item.disabled);
    return selected !== -1 ? selected : this.#items.findIndex((item) => !item.disabled);
  }

  #findEnabled(from: number, step: 1 | -1): number {
    for (let index = from; index >= 0 && index < this.#items.length; index += step) {
      if (!this.#items[index]?.disabled) return index;
    }
    return -1;
  }

  #activate(index: number): void {
    if (index === -1 || index === this.#activeIndex) return;
    this.#activeIndex = index;
    this.notify();
  }
}
