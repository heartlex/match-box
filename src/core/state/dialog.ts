import { Store } from './store.ts';

/**
 * Open state and return value of a modal dialog. Mirrors the native
 * `<dialog>`: closing without a value keeps the previous `returnValue`.
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
    this.notify();
  }

  close(returnValue?: string): void {
    if (!this.#open) return;
    this.#open = false;
    if (returnValue !== undefined) this.#returnValue = returnValue;
    this.notify();
  }
}
