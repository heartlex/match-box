import { LitElement, html, type PropertyDeclarations, type PropertyValues, type TemplateResult } from 'lit';
import { DelegatesFocus } from '../../lit/delegates-focus.ts';
import { FormAssociated } from '../../lit/form-associated.ts';
import type { ColorRole } from './color.ts';
import { fieldControlProperties, linkField, type FieldControl } from './field-control.ts';
import type { Size } from './size.ts';

/**
 * What `mb-checkbox` and `mb-switch` share: checked state with native
 * semantics (the `checked` attribute is the reset state), the form value,
 * `required` meaning checked, `change`, and the field protocol.
 */
export class ToggleBase extends DelegatesFocus(FormAssociated(LitElement)) implements FieldControl {
  static override properties: PropertyDeclarations = {
    checked: { type: Boolean, attribute: false },
    defaultChecked: { type: Boolean, attribute: 'checked' },
    color: {},
    size: {},
    groupDisabled: { attribute: false },
    ...fieldControlProperties,
  };

  /** Current state. The `checked` attribute sets the initial and reset state. */
  declare checked: boolean;
  /** The `checked` attribute. */
  declare defaultChecked: boolean;
  /** The color role of the checked state. */
  declare color: ColorRole;
  /** Box or track, label, and font size, from the size scale. Unknown values render as `md`. */
  declare size: Size;
  /** Set by `mb-checkbox-group` while it is disabled. */
  declare groupDisabled: boolean;
  /** Set by `mb-field`. */
  declare fieldLabel: string;
  /** Set by `mb-field`. */
  declare fieldDescription: string;
  /** Set by `mb-field`. */
  declare fieldError: string;

  #dirty = false;
  #syncing = false;
  #labelText = '';

  constructor() {
    super();
    this.value = 'on';
    this.checked = false;
    this.defaultChecked = false;
    this.color = 'neutral';
    this.size = 'md';
    this.groupDisabled = false;
    this.fieldLabel = '';
    this.fieldDescription = '';
    this.fieldError = '';
  }

  protected get input(): HTMLInputElement | null {
    return this.renderRoot.querySelector('input');
  }

  /** Inside `mb-checkbox-group`, the group submits and validates instead. */
  protected get grouped(): boolean {
    return this.parentElement?.localName === 'mb-checkbox-group';
  }

  protected get inputDisabled(): boolean {
    return this.disabled || this.groupDisabled || this.matches(':disabled');
  }

  protected override isEmpty(): boolean {
    return !this.checked;
  }

  protected override requiredMessage(): string {
    return 'Please check this box if you want to proceed.';
  }

  protected override validationAnchor(): HTMLElement | undefined {
    return this.input ?? undefined;
  }

  override formResetCallback(): void {
    super.formResetCallback();
    this.value = this.getAttribute('value') ?? 'on';
    this.#dirty = false;
    this.#syncing = true;
    this.checked = this.defaultChecked;
  }

  override formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state !== 'string') return;
    this.#dirty = true;
    this.checked = state === 'checked';
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (changed.has('checked') && this.hasUpdated && !this.#syncing) this.#dirty = true;
    this.#syncing = false;
    if (changed.has('defaultChecked') && !this.#dirty) this.checked = this.defaultChecked;
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('checked')) this.revalidate();
    this.internals.setFormValue(this.checked && !this.grouped ? this.value : null, this.checked ? 'checked' : '');
    const input = this.input;
    const own = this.renderRoot.querySelector('#own-label');
    if (input) linkField(input, this, this.renderRoot as ShadowRoot, { own: own ? [own] : [] });
  }

  /** Call from the inner input's `change`. */
  protected toggleFromInput(event: Event): void {
    this.#dirty = true;
    this.checked = (event.target as HTMLInputElement).checked;
    this.markEdited();
    // change does not cross the shadow boundary.
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /** Keeps the hidden copy of the slotted label text current. */
  protected readonly onLabelSlotChange = (event: Event): void => {
    this.#labelText = (event.target as HTMLSlotElement)
      .assignedNodes({ flatten: true })
      .map((node) => node.textContent ?? '')
      .join('')
      .trim();
    this.requestUpdate();
  };

  /** The hidden copy of the slotted label text, which names the input in every engine. */
  protected ownLabel(): TemplateResult {
    return html`<span id="own-label" class="visually-hidden">${this.#labelText}</span>`;
  }
}
