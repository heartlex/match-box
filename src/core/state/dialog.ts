import { Store } from './store.ts';

/**
 * Open state and return value of a modal dialog. Unlike the native
 * `<dialog>`, `show()` clears `returnValue`, so a dismissal (Escape or an
 * outside click) reports `''` rather than the value of an earlier close.
 */
export class DialogState extends Store {
  #open = false;
  #returnValue = '';

  get open(): boolean {
    return this.#open;
  }

  get returnValue(): string {
    return this.#returnValue;
  }

  show(): void {
    if (this.#open) return;
    this.#open = true;
    this.#returnValue = '';
    this.notify();
  }

  close(returnValue?: string): void {
    if (!this.#open) return;
    this.#open = false;
    if (returnValue !== undefined) this.#returnValue = returnValue;
    this.notify();
  }
}
