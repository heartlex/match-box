// Input types in which Enter submits the form: the fields that block implicit submission.
const implicitSubmitTypes = new Set([
  'text',
  'search',
  'url',
  'tel',
  'email',
  'password',
  'date',
  'month',
  'week',
  'time',
  'datetime-local',
  'number',
]);

/** A native input in which Enter submits its form. */
export function isImplicitSubmitField(element: unknown): element is HTMLInputElement {
  return element instanceof HTMLInputElement && implicitSubmitTypes.has(element.type);
}

export function isNativeSubmit(element: Element): boolean {
  return (
    (element instanceof HTMLButtonElement && element.type === 'submit') ||
    (element instanceof HTMLInputElement && (element.type === 'submit' || element.type === 'image'))
  );
}

/** A submit `mb-button`; one with `href` renders a link, which never submits. */
export function isSubmitMbButton(element: Element): boolean {
  const button = element as Element & { type?: string; href?: string };
  return element.localName === 'mb-button' && button.type === 'submit' && button.href == null;
}
