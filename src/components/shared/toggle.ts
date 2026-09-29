import { LitElement, html, type PropertyDeclarations, type PropertyValues, type TemplateResult } from 'lit';
import { DelegatesFocus } from '../../lit/delegates-focus.ts';
import { FormAssociated } from '../../lit/form-associated.ts';
import type { ColorRole } from './color.ts';
import { fieldControlProperties, linkField, type FieldControl } from './field-control.ts';
import type { Size } from './size.ts';

/**
 * Internal: fired directly at the parent element (not bubbling, not composed) when a
 * grouped control's `checked`, `disabled`, or `value` changes, so `mb-checkbox-group` can
 * re-read it. Not part of the public API.
 */
export const groupSyncEvent = 'mb-checkbox-group-sync';

/**
 * What `mb-checkbox` and `mb-switch` share: checked state with native
 * semantics (the `checked` attribute is the reset state), the form value,
 * `required` meaning checked, `change`, and the field protocol.
 */
export class ToggleBase extends DelegatesFocus(FormAssociated(LitElement)) implements FieldControl {
  static override properties: PropertyDeclarations = {
    checked: { type: Boolean, attribute: false, noAccessor: true },
    defaultChecked: { type: Boolean, attribute: 'checked' },
    color: {},
    size: {},
    groupDisabled: { attribute: false },
    ...fieldControlProperties,
  };

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

  #checked = false;
  #dirty = false;
  #syncing = false;
  #labelText = '';
  #labelSlot: HTMLSlotElement | null = null;
  readonly #labelObserver = new MutationObserver(() => this.#syncLabelText());

  constructor() {
    super();
    this.value = 'on';
    this.defaultChecked = false;
    this.color = 'neutral';
    this.size = 'md';
    this.groupDisabled = false;
    this.fieldLabel = '';
    this.fieldDescription = '';
    this.fieldError = '';
  }

  /**
   * Current state. The `checked` attribute sets the initial and reset
   * state. Setting this property directly, like a native checkbox's,
   * marks the control dirty: later attribute or `defaultChecked` changes
   * no longer apply, until the next reset.
   */
  get checked(): boolean {
    return this.#checked;
  }

  set checked(value: boolean) {
    const old = this.#checked;
    this.#checked = value;
    if (!this.#syncing) this.#dirty = true;
    this.requestUpdate('checked', old);
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

  // A grouped checkbox does not validate on its own: mb-checkbox-group validates the group.
  protected override isEmpty(): boolean {
    return !this.grouped && !this.checked;
  }

  protected override requiredMessage(): string {
    return 'Please check this box if you want to proceed.';
  }

  protected override validationAnchor(): HTMLElement | undefined {
    return this.input ?? undefined;
  }

  // A native checkbox's value never changes on reset (only its checkedness does): undo the
  // mixin's value reset, which is right for mb-input but wrong here.
  override formResetCallback(): void {
    const value = this.value;
    super.formResetCallback();
    this.value = value;
    this.#dirty = false;
    this.#syncing = true;
    this.checked = this.defaultChecked;
    this.#syncing = false;
  }

  override formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state !== 'string') return;
    this.checked = state === 'checked';
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (changed.has('defaultChecked') && !this.#dirty) {
      this.#syncing = true;
      this.checked = this.defaultChecked;
      this.#syncing = false;
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('checked')) this.revalidate();
    this.internals.setFormValue(this.checked && !this.grouped ? this.value : null, this.checked ? 'checked' : '');
    const input = this.input;
    const own = this.renderRoot.querySelector('#own-label');
    if (input) linkField(input, this, this.renderRoot as ShadowRoot, { own: own ? [own] : [] });
    // Tells mb-checkbox-group to re-read: it cannot see a checked/disabled/value change that
    // did not come through a `change` event, a slotchange, its own `values`, or a reset.
    if (this.grouped && (changed.has('checked') || changed.has('disabled') || changed.has('value'))) {
      this.parentElement?.dispatchEvent(new CustomEvent(groupSyncEvent, { bubbles: false, composed: false }));
    }
  }

  /** Toggles, like a native checkbox's `click()`. Does nothing when disabled. */
  override click(): void {
    const input = this.input;
    if (input) input.click();
    else super.click();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // A reconnect (e.g. moving the control in the DOM) must resume observing the same
    // assigned nodes: slotchange will not fire again since the assignment did not change.
    this.#observeLabelSlot();
    // `grouped` depends on parentElement, read in updated()/render(); moving into or out of
    // a group changes it without a reactive property change, so force both to catch up.
    this.requestUpdate();
    this.revalidate();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#labelObserver.disconnect();
  }

  /** Call from the inner input's `change`. */
  protected toggleFromInput(event: Event): void {
    this.checked = (event.target as HTMLInputElement).checked;
    this.markEdited();
    // change does not cross the shadow boundary.
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /** Keeps the hidden copy of the slotted label text current. */
  protected readonly onLabelSlotChange = (event: Event): void => {
    this.#labelSlot = event.target as HTMLSlotElement;
    this.#syncLabelText();
    this.#observeLabelSlot();
  };

  /** The hidden copy of the slotted label text, which names the input in every engine. */
  protected ownLabel(): TemplateResult {
    return html`<span id="own-label" class="visually-hidden">${this.#labelText}</span>`;
  }

  #syncLabelText(): void {
    const text = (this.#labelSlot?.assignedNodes({ flatten: true }) ?? [])
      .map((node) => node.textContent ?? '')
      .join('')
      .trim();
    if (text === this.#labelText) return;
    this.#labelText = text;
    this.requestUpdate();
  }

  // Watches the assigned nodes for text edited in place, such as a slotted span whose
  // content a framework updates without reslotting.
  #observeLabelSlot(): void {
    this.#labelObserver.disconnect();
    const assigned = this.#labelSlot?.assignedNodes({ flatten: true }) ?? [];
    for (const node of assigned) this.#labelObserver.observe(node, { characterData: true, childList: true, subtree: true });
  }
}
