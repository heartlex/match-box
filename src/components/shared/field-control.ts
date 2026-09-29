import { css, html, type TemplateResult } from 'lit';
import type { Size } from './size.ts';

/**
 * A control that `mb-field` can label, describe, and show an error for.
 * The field sets the three `field*` properties; the control renders hidden
 * copies of their text and points its focusable element at them.
 */
export interface FieldControl extends HTMLElement {
  fieldLabel: string;
  fieldDescription: string;
  fieldError: string;
  size: Size;
  required: boolean;
  readonly validationMessage: string;
  readonly form: HTMLFormElement | null;
}

/** Lit property declarations for the `field*` members. */
export const fieldControlProperties = {
  fieldLabel: { attribute: false },
  fieldDescription: { attribute: false },
  fieldError: { attribute: false },
} as const;

export function isFieldControl(element: Element): element is FieldControl {
  return 'fieldLabel' in element && 'fieldDescription' in element && 'fieldError' in element;
}

/** Hidden from sight, still read by assistive technology. */
export const visuallyHidden = css`
  .visually-hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;

/** Hidden copies of the field's text, in the control's shadow root. */
export function fieldText(control: FieldControl): TemplateResult {
  return html`<span id="field-label" class="visually-hidden">${control.fieldLabel}</span
    ><span id="field-description" class="visually-hidden">${control.fieldDescription}</span
    ><span id="field-error" class="visually-hidden">${control.fieldError}</span>`;
}

export interface LinkFieldOptions {
  /** Named by these after the field label, such as a checkbox's own label copy. */
  own?: readonly Element[];
  /** Named by these when there is no field label, such as associated `<label for>`s. */
  fallback?: readonly Element[];
  /** `false` leaves the name to another behavior. */
  name?: boolean;
}

/**
 * Points `target` at the field text with ARIA element references, which
 * stay inside `root`, and sets `aria-invalid` while there is an error.
 */
export function linkField(
  target: HTMLElement,
  control: FieldControl,
  root: ShadowRoot,
  options: LinkFieldOptions = {},
): void {
  const byId = (id: string): HTMLElement[] => {
    const found = root.getElementById(id);
    return found ? [found] : [];
  };
  if (options.name !== false) {
    const own = [...(options.own ?? [])];
    const labels =
      control.fieldLabel !== '' ? [...byId('field-label'), ...own] : own.length > 0 ? own : [...(options.fallback ?? [])];
    target.ariaLabelledByElements = labels.length > 0 ? labels : null;
  }
  const described = [
    ...(control.fieldDescription !== '' ? byId('field-description') : []),
    ...(control.fieldError !== '' ? byId('field-error') : []),
  ];
  target.ariaDescribedByElements = described.length > 0 ? described : null;
  if (control.fieldError !== '') target.setAttribute('aria-invalid', 'true');
  else target.removeAttribute('aria-invalid');
}
