import { Store } from './store.ts';

export interface DisclosureStateOptions {
  /** Initial state. Defaults to collapsed. */
  expanded?: boolean;
}

/** Open or closed state of a disclosure. */
export class DisclosureState extends Store {
  #expanded: boolean;

  constructor(options: DisclosureStateOptions = {}) {
    super();
    this.#expanded = options.expanded ?? false;
  }

  get expanded(): boolean {
    return this.#expanded;
  }

  open(): void {
    this.#set(true);
  }

  close(): void {
    this.#set(false);
  }

  toggle(): void {
    this.#set(!this.#expanded);
  }

  #set(expanded: boolean): void {
    if (expanded === this.#expanded) return;
    this.#expanded = expanded;
    this.notify();
  }
}
