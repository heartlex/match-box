/** Registers `constructor` as `tag` unless the tag is already registered. */
export function define(tag: string, constructor: CustomElementConstructor): void {
  if (!customElements.get(tag)) customElements.define(tag, constructor);
}
