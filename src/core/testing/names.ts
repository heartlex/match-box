function textOf(elements: readonly Element[]): string {
  return elements
    .map((element) => element.textContent?.trim() ?? '')
    .filter((text) => text !== '')
    .join(' ');
}

/**
 * The text of the elements `element` points to with `aria-labelledby` or
 * `aria-describedby`, whether set as element references or as ids.
 */
export function referencedText(element: Element, kind: 'labelledby' | 'describedby'): string {
  const references = kind === 'labelledby' ? element.ariaLabelledByElements : element.ariaDescribedByElements;
  if (references && references.length > 0) return textOf(references);
  const ids = element.getAttribute(`aria-${kind}`)?.split(/\s+/).filter(Boolean) ?? [];
  const root = element.getRootNode() as Document | ShadowRoot;
  return textOf(ids.map((id) => root.getElementById(id)).filter((found): found is HTMLElement => found !== null));
}

/**
 * A simplified accessible name: `aria-labelledby`, then `aria-label`, then
 * associated `<label>`s, then a fieldset's `<legend>`. Enough to check the
 * wiring a suite sets up, not a full accessible name computation.
 */
export function nameOf(element: Element): string {
  const labelled = referencedText(element, 'labelledby');
  if (labelled !== '') return labelled;
  const label = element.getAttribute('aria-label');
  if (label) return label;
  const labels = (element as Partial<HTMLInputElement>).labels;
  if (labels && labels.length > 0) return textOf([...labels]);
  const legend = element.localName === 'fieldset' ? element.querySelector(':scope > legend') : null;
  return legend?.textContent?.trim() ?? '';
}
