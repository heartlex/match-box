import { Store } from './store.ts';

export interface AccordionStateOptions {
  /** Allow more than one open item. Defaults to false. */
  multiple?: boolean;
}

/**
 * Which items of an accordion are open. With `multiple` false, opening an
 * item closes the others.
 */
export class AccordionState extends Store {
  #multiple: boolean;
  #items: readonly string[] = [];
  #open: ReadonlySet<string> = new Set();

  constructor(options: AccordionStateOptions = {}) {
    super();
    this.#multiple = options.multiple ?? false;
  }

  get multiple(): boolean {
    return this.#multiple;
  }

  /** Item keys in order. */
  get items(): readonly string[] {
    return this.#items;
  }

  /** Keys of the open items. */
  get openKeys(): ReadonlySet<string> {
    return this.#open;
  }

  isOpen(key: string): boolean {
    return this.#open.has(key);
  }

  /**
   * Replaces the items. Drops open keys that are gone. In single mode, keeps
   * only the first open item. Does nothing when the keys are unchanged.
   */
  setItems(keys: readonly string[]): void {
    if (keys.length === this.#items.length && keys.every((key, index) => key === this.#items[index])) return;
    this.#items = [...keys];
    this.#setOpen(keys.filter((key) => this.#open.has(key)));
    this.notify();
  }

  /** Turning multiple off keeps only the first open item, in item order. */
  setMultiple(multiple: boolean): void {
    if (multiple === this.#multiple) return;
    this.#multiple = multiple;
    this.#setOpen(this.#items.filter((key) => this.#open.has(key)));
    this.notify();
  }

  open(key: string): void {
    if (!this.#items.includes(key) || this.#open.has(key)) return;
    this.#open = this.#multiple ? new Set([...this.#open, key]) : new Set([key]);
    this.notify();
  }

  close(key: string): void {
    if (!this.#open.has(key)) return;
    this.#open = new Set([...this.#open].filter((open) => open !== key));
    this.notify();
  }

  toggle(key: string): void {
    if (this.#open.has(key)) this.close(key);
    else this.open(key);
  }

  #setOpen(keys: readonly string[]): void {
    this.#open = new Set(this.#multiple ? keys : keys.slice(0, 1));
  }
}
