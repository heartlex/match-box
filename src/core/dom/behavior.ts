/** What every `attachX` function returns. */
export interface Behavior<S> {
  /** The layer 1 state driving this behavior. */
  readonly state: S;
  /** Re-reads the elements and rewrites attributes. Call after the DOM you passed in changes. */
  sync(): void;
  /** Removes listeners and every attribute the behavior wrote. */
  dispose(): void;
}
