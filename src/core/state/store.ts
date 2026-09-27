/** Called synchronously after an action changes a state object. */
export type Listener = () => void;

/**
 * Base class for layer 1 state. Holds listeners and notifies them.
 * Actions call `notify()` only when they changed something.
 */
export class Store {
  #listeners = new Set<Listener>();

  /** Registers a listener. Returns a function that removes it. */
  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  protected notify(): void {
    for (const listener of [...this.#listeners]) listener();
  }
}
