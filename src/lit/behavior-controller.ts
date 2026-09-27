import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { Behavior } from '../core/dom/behavior.ts';

/** Anything with a `subscribe` method, such as a layer 1 state. */
export interface Subscribable {
  subscribe(listener: () => void): () => void;
}

/**
 * Runs a core/dom behavior inside a Lit host. The state lives as long as the
 * controller, so it survives disconnect and reconnect. The behavior attaches
 * after the host's first update, when its elements exist, and syncs after
 * every later update.
 */
export class BehaviorController<S extends Subscribable, E> implements ReactiveController {
  readonly state: S;
  readonly #host: ReactiveControllerHost;
  readonly #elements: () => E;
  readonly #attach: (elements: E, state: S) => Behavior<S>;
  #behavior: Behavior<S> | undefined;
  #connected = false;

  constructor(
    host: ReactiveControllerHost,
    state: S,
    elements: () => E,
    attach: (elements: E, state: S) => Behavior<S>,
  ) {
    this.#host = host;
    this.state = state;
    this.#elements = elements;
    this.#attach = attach;
    state.subscribe(() => host.requestUpdate());
    host.addController(this);
  }

  hostConnected(): void {
    this.#connected = true;
    this.#host.requestUpdate();
  }

  hostUpdated(): void {
    if (!this.#connected) return;
    if (this.#behavior) this.#behavior.sync();
    else this.#behavior = this.#attach(this.#elements(), this.state);
  }

  hostDisconnected(): void {
    this.#connected = false;
    this.#behavior?.dispose();
    this.#behavior = undefined;
  }
}
