import { LitElement, html, type PropertyValues } from 'lit';
import { isFieldControl, type FieldControl } from '../shared/field-control.ts';
import { sizeName, type Size } from '../shared/size.ts';
import { fieldStyles } from './field.styles.ts';

const controlEvents = ['input', 'change', 'focusout', 'invalid'] as const;

type TextSlot = 'label' | 'description' | 'error';

const textSlots: readonly TextSlot[] = ['label', 'description', 'error'];

/**
 * A label, a description, and an error around one control, connected to it.
 * The control's value and validity stay its own; the field shows the
 * `error` you set, or the control's validation message once the user
 * changed the control and left it, or a submit attempt reported it.
 *
 * @tag mb-field
 * @slot - The control: `mb-input`, `mb-checkbox`, `mb-switch`, `mb-checkbox-group`, or `mb-listbox`.
 * @slot label - Rich label content; wins over the `label` attribute.
 * @slot description - Rich description content.
 * @slot error - Rich error content; always shown when present.
 * @csspart label - The visible label. Clicking it focuses the control.
 * @csspart required - The asterisk after the label of a required control.
 * @csspart description - The description.
 * @csspart error - The error, a polite live region.
 * @csspart control - The wrapper of the control.
 * @cssprop --mb-field-gap - Space between label, description, control, and error.
 * @cssprop --mb-field-label-color - Label color.
 * @cssprop --mb-field-label-font-size - Label font size. Defaults to the size scale.
 * @cssprop --mb-field-description-color - Description color.
 * @cssprop --mb-field-error-color - Error and asterisk color.
 */
export class MbField extends LitElement {
  static override styles = fieldStyles;
  static override properties = {
    label: {},
    description: {},
    error: {},
    size: {},
  };

  declare label: string;
  declare description: string;
  /** A custom error, shown at once; `''` falls back to the control's validation message. */
  declare error: string;
  /** Label size, passed to a control without its own `size`. Unknown values render as `md`. */
  declare size: Size;

  #control: FieldControl | null = null;
  #form: HTMLFormElement | null = null;
  #slotText: Record<TextSlot, string> = { label: '', description: '', error: '' };
  #slotElements: Partial<Record<TextSlot, HTMLSlotElement>> = {};
  readonly #textObservers: Record<TextSlot, MutationObserver> = {
    label: new MutationObserver(() => this.#syncTextSlot('label')),
    description: new MutationObserver(() => this.#syncTextSlot('description')),
    error: new MutationObserver(() => this.#syncTextSlot('error')),
  };

  constructor() {
    super();
    this.label = '';
    this.description = '';
    this.error = '';
    this.size = 'md';
  }

  /** The error shown now, or `''`. */
  get shownError(): string {
    const custom = this.#slotText.error || this.error;
    if (custom !== '') return custom;
    const control = this.#control;
    return control !== null && control.matches(':state(user-invalid)') ? control.validationMessage : '';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // The control is usually already a light DOM child by the time this runs (parsed markup, or
    // moved together with the field): bind it now so the first render is already final, instead
    // of waiting for slotchange (a later, async render would shift layout, e.g. the required
    // asterisk appearing).
    if (this.#control === null) {
      const control = [...this.children].find(isFieldControl) ?? null;
      if (control !== null) this.#bind(control);
    } else {
      this.#attachListeners();
    }
    for (const name of textSlots) this.#observeTextSlot(name);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // Keep #control and #form: a reconnect (e.g. moving the field in the DOM) must rebind to the
    // same control, and slotchange will not fire again since the assignment did not change.
    this.#detachListeners();
    for (const name of textSlots) this.#textObservers[name].disconnect();
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    const control = this.#control;
    if (control === null) return;
    if (control.form !== this.#form) this.#bind(control);
    control.fieldLabel = this.#slotText.label || this.label;
    control.fieldDescription = this.#slotText.description || this.description;
    control.fieldError = this.shownError;
    if (!control.hasAttribute('size')) control.size = this.size;
  }

  override render() {
    const label = this.#slotText.label || this.label;
    const description = this.#slotText.description || this.description;
    return html`<div class="base size-${sizeName(this.size)}">
      <div class="heading" ?hidden=${label === ''}>
        <span part="label" @click=${this.#focusControl}
          ><slot name="label" @slotchange=${this.#onTextSlot('label')}>${this.label}</slot></span
        >
        <span part="required" aria-hidden="true" ?hidden=${!(this.#control?.required ?? false)}>*</span>
      </div>
      <div part="description" ?hidden=${description === ''}>
        <slot name="description" @slotchange=${this.#onTextSlot('description')}>${this.description}</slot>
      </div>
      <div part="control"><slot @slotchange=${this.#onControlSlot}></slot></div>
      <div part="error" aria-live="polite" class=${this.shownError !== '' ? 'has-error' : ''}>
        <slot name="error" @slotchange=${this.#onTextSlot('error')}>${this.#slotText.error ? '' : this.shownError}</slot>
      </div>
    </div>`;
  }

  #attachListeners(): void {
    for (const type of controlEvents) this.#control?.addEventListener(type, this.#refresh);
    this.#form?.addEventListener('reset', this.#onReset);
  }

  #detachListeners(): void {
    for (const type of controlEvents) this.#control?.removeEventListener(type, this.#refresh);
    this.#form?.removeEventListener('reset', this.#onReset);
  }

  #bind(control: FieldControl | null): void {
    this.#detachListeners();
    const old = this.#control;
    // A control that leaves the field must not keep its text. A field that is only moved
    // keeps its control: disconnectedCallback does not unbind.
    if (old !== null && old !== control) {
      old.fieldLabel = '';
      old.fieldDescription = '';
      old.fieldError = '';
    }
    this.#control = control;
    this.#form = control?.form ?? null;
    this.#attachListeners();
  }

  // Lit batches the update after every listener of the event has run, so the control's states are current.
  readonly #refresh = (): void => {
    this.requestUpdate();
  };

  // The reset event fires before the controls are reset.
  readonly #onReset = (): void => {
    setTimeout(this.#refresh);
  };

  readonly #onControlSlot = (event: Event): void => {
    const assigned = (event.target as HTMLSlotElement).assignedElements({ flatten: true });
    const control = assigned.find(isFieldControl) ?? null;
    if (control !== this.#control) this.#bind(control);
    this.requestUpdate();
  };

  #onTextSlot(name: TextSlot) {
    return (event: Event): void => {
      this.#slotElements[name] = event.target as HTMLSlotElement;
      this.#syncTextSlot(name);
      this.#observeTextSlot(name);
    };
  }

  // Without `flatten`, an unassigned slot's own fallback content is never
  // returned: reading it back (as `flatten: true` would) turns the error
  // slot's fallback, which renders `shownError`, into a feedback loop.
  #syncTextSlot(name: TextSlot): void {
    const slot = this.#slotElements[name];
    const assigned = slot ? slot.assignedNodes() : [];
    const text = assigned
      .map((node) => node.textContent ?? '')
      .join('')
      .trim();
    if (text === this.#slotText[name]) return;
    this.#slotText = { ...this.#slotText, [name]: text };
    this.requestUpdate();
  }

  // Watches the really assigned nodes (never the slot's own fallback, which would loop) for text
  // edited in place, such as a slotted span whose content a framework updates without reslotting.
  #observeTextSlot(name: TextSlot): void {
    const observer = this.#textObservers[name];
    observer.disconnect();
    const slot = this.#slotElements[name];
    const assigned = slot?.assignedNodes() ?? [];
    for (const node of assigned) observer.observe(node, { characterData: true, childList: true, subtree: true });
  }

  readonly #focusControl = (): void => {
    this.#control?.focus();
  };
}
