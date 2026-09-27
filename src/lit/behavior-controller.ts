import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { Behavior } from '../core/dom/behavior.ts';

/** Anything with a `subscribe` method, such as a layer 1 state. */
export interface Subscribable {
  subscribe(listener: () => void): () => void;
}

/** Elements as a template query returns them: any of them may not be rendered yet. */
export type Pending<E> = { [K in keyof E]: E[K] | null };

function sameElements<E extends object>(a: Pending<E>, b: Pending<E>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof E>;
  // Callbacks such as `items` are new closures on every call; compare elements only.
  return [...keys].every((key) => typeof a[key] === 'function' || a[key] === b[key]);
}

/**
 * Runs a core/dom behavior inside a Lit host. The state lives as long as the
 * controller, so it survives disconnect and reconnect. After every update the
 * controller re-reads the elements: it attaches once the required ones are
 * rendered, re-attaches when one is replaced, detaches when one disappears,
 * and otherwise syncs.
 */
export class BehaviorController<S extends Subscribable, E extends object> implements ReactiveController {
  readonly state: S;
  readonly #host: ReactiveControllerHost;
  readonly #elements: () => Pending<E>;
  readonly #attach: (elements: E, state: S) => Behavior<S>;
  readonly #required: readonly (keyof E)[];
  #behavior: Behavior<S> | undefined;
  #bound: Pending<E> | undefined;
  #connected = false;

  constructor(
    host: ReactiveControllerHost,
    state: S,
    elements: () => Pending<E>,
    attach: (elements: E, state: S) => Behavior<S>,
    required: readonly (keyof E)[],
  ) {
    this.#host = host;
    this.state = state;
    this.#elements = elements;
    this.#attach = attach;
    this.#required = required;
    state.subscribe(() => host.requestUpdate());
    host.addController(this);
  }

  hostConnected(): void {
    this.#connected = true;
    this.#host.requestUpdate();
  }

  hostUpdated(): void {
    if (!this.#connected) return;
    const elements = this.#elements();
    if (this.#bound && !sameElements(this.#bound, elements)) this.#detach();
    if (this.#required.some((key) => elements[key] === null || elements[key] === undefined)) {
      this.#detach();
      return;
    }
    if (this.#behavior) {
      this.#behavior.sync();
    } else {
      // Required elements are present; optional ones the attach functions treat as absent when null.
      this.#behavior = this.#attach(elements as E, this.state);
      this.#bound = elements;
    }
  }

  hostDisconnected(): void {
    this.#connected = false;
    this.#detach();
  }

  #detach(): void {
    this.#behavior?.dispose();
    this.#behavior = undefined;
    this.#bound = undefined;
  }
}
