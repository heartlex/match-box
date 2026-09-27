/** ARIA properties that take element references instead of ID strings. */
export type AriaReferenceProperty =
  | 'ariaLabelledByElements'
  | 'ariaDescribedByElements'
  | 'ariaControlsElements';

/** Attribute values to write. `null` means the attribute must be absent. */
export type Attributes = Readonly<Record<string, string | null>>;

export type References = Readonly<
  Partial<Record<AriaReferenceProperty, readonly Element[] | null>>
>;

/**
 * Writes attributes and ARIA element references, remembering what it wrote
 * per element. On the next write to the same element, anything it wrote
 * before and no longer produces is removed.
 */
export class AttributeWriter {
  #attributes = new Map<Element, Set<string>>();
  #references = new Map<Element, Set<AriaReferenceProperty>>();

  write(element: Element, attributes: Attributes): void {
    const previous = this.#attributes.get(element) ?? new Set<string>();
    const next = new Set<string>();
    for (const [name, value] of Object.entries(attributes)) {
      if (value === null) continue;
      next.add(name);
      if (element.getAttribute(name) !== value) element.setAttribute(name, value);
    }
    for (const name of previous) {
      if (!next.has(name)) element.removeAttribute(name);
    }
    this.#attributes.set(element, next);
  }

  writeReferences(element: Element, references: References): void {
    const previous = this.#references.get(element) ?? new Set<AriaReferenceProperty>();
    const next = new Set<AriaReferenceProperty>();
    for (const [name, value] of Object.entries(references) as [
      AriaReferenceProperty,
      readonly Element[] | null | undefined,
    ][]) {
      if (value === null || value === undefined) continue;
      next.add(name);
      element[name] = [...value];
    }
    for (const name of previous) {
      if (!next.has(name)) element[name] = null;
    }
    this.#references.set(element, next);
  }

  /** Removes everything written to `element` and forgets it. */
  release(element: Element): void {
    for (const name of this.#attributes.get(element) ?? []) element.removeAttribute(name);
    for (const name of this.#references.get(element) ?? []) element[name] = null;
    this.#attributes.delete(element);
    this.#references.delete(element);
  }

  /** Releases every element not in `elements`. */
  retain(elements: Iterable<Element>): void {
    const keep = new Set(elements);
    const known = new Set([...this.#attributes.keys(), ...this.#references.keys()]);
    for (const element of known) {
      if (!keep.has(element)) this.release(element);
    }
  }

  /** Releases every element. */
  releaseAll(): void {
    this.retain([]);
  }
}
