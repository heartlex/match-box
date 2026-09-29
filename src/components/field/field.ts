import { LitElement, html, type PropertyValues } from 'lit';
import { isFieldControl, type FieldControl } from '../shared/field-control.ts';
import { sizeName, type Size } from '../shared/size.ts';
import { fieldStyles } from './field.styles.ts';

const controlEvents = ['input', 'change', 'focusout', 'invalid'] as const;

type TextSlot = 'label' | 'description' | 'error';

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

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#bind(null);
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
      <div part="error" aria-live="polite">
        <slot name="error" @slotchange=${this.#onTextSlot('error')}>${this.#slotText.error ? '' : this.shownError}</slot>
      </div>
    </div>`;
  }

  #bind(control: FieldControl | null): void {
    for (const type of controlEvents) this.#control?.removeEventListener(type, this.#refresh);
    this.#form?.removeEventListener('reset', this.#onReset);
    this.#control = control;
    this.#form = control?.form ?? null;
    for (const type of controlEvents) control?.addEventListener(type, this.#refresh);
    this.#form?.addEventListener('reset', this.#onReset);
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

  // Without `flatten`, an unassigned slot's own fallback content is never
  // returned: reading it back (as `flatten: true` would) turns the error
  // slot's fallback, which renders `shownError`, into a feedback loop.
  #onTextSlot(name: TextSlot) {
    return (event: Event): void => {
      const slot = event.target as HTMLSlotElement;
      const text = slot
        .assignedNodes()
        .map((node) => node.textContent ?? '')
        .join('')
        .trim();
      if (text === this.#slotText[name]) return;
      this.#slotText = { ...this.#slotText, [name]: text };
      this.requestUpdate();
    };
  }

  readonly #focusControl = (): void => {
    this.#control?.focus();
  };
}
