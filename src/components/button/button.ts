import { LitElement, html } from 'lit';
import { DelegatesFocus } from '../../lit/delegates-focus.ts';
import { colorRole, type ColorRole } from '../shared/color.ts';
import { buttonStyles } from './button.styles.ts';

export type ButtonVariant = 'default' | 'outline' | 'ghost';

// Input types in which Enter submits the form (implicit submission).
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

function isNativeSubmit(element: Element): boolean {
  return (
    (element instanceof HTMLButtonElement && element.type === 'submit') ||
    (element instanceof HTMLInputElement && (element.type === 'submit' || element.type === 'image'))
  );
}
export type ButtonType = 'button' | 'submit' | 'reset';

/**
 * A button.
 *
 * With `type="submit"`, Enter in a text field of its form submits the form
 * when the form has no native submit button, as a native submit button
 * would. The first submit `mb-button` in the form handles it; a disabled one
 * blocks it.
 *
 * @tag mb-button
 * @slot - The label.
 * @slot prefix - Content before the label, such as an icon.
 * @slot suffix - Content after the label.
 * @csspart base - The native button.
 * @csspart label - The label wrapper.
 * @csspart prefix - The prefix wrapper.
 * @csspart suffix - The suffix wrapper.
 * @cssprop --mb-button-bg - Background.
 * @cssprop --mb-button-bg-hover - Background on hover.
 * @cssprop --mb-button-fg - Text color.
 * @cssprop --mb-button-border-color - Border color.
 * @cssprop --mb-button-border-width - Border width.
 * @cssprop --mb-button-radius - Corner radius.
 * @cssprop --mb-button-height - Minimum height.
 * @cssprop --mb-button-padding-inline - Horizontal padding.
 * @cssprop --mb-button-gap - Space between prefix, label, and suffix.
 * @cssprop --mb-button-font-family - Font family.
 * @cssprop --mb-button-font-size - Font size.
 * @cssprop --mb-button-font-weight - Font weight.
 */
export class MbButton extends DelegatesFocus(LitElement) {
  static formAssociated = true;
  static override styles = buttonStyles;
  static override properties = {
    variant: {},
    color: {},
    type: {},
    disabled: { type: Boolean, reflect: true },
  };

  /** The structure: filled, outlined, or background-free until hover. Unknown values render as `default`. */
  declare variant: ButtonVariant;
  /** The color role. */
  declare color: ColorRole;
  /** What the button does in a form. */
  declare type: ButtonType;
  declare disabled: boolean;

  readonly #internals: ElementInternals;
  #form: HTMLFormElement | null = null;
  #formDisabled = false;
  #hasPrefix = false;
  #hasSuffix = false;

  constructor() {
    super();
    this.variant = 'default';
    this.color = 'neutral';
    this.type = 'button';
    this.disabled = false;
    this.#internals = this.attachInternals();
  }

  /** The form this button submits or resets, if any. */
  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  /** Called by the platform when the button joins or leaves a form. */
  formAssociatedCallback(form: HTMLFormElement | null): void {
    this.#form?.removeEventListener('keydown', this.#onFormKeydown);
    this.#form = form;
    form?.addEventListener('keydown', this.#onFormKeydown);
  }

  /** Called by the platform when a `<fieldset>` ancestor is disabled or enabled. */
  formDisabledCallback(disabled: boolean): void {
    this.#formDisabled = disabled;
    this.requestUpdate();
  }

  override render() {
    const disabled = this.disabled || this.#formDisabled;
    return html`<button
      part="base"
      class="variant-${this.variant} color-${colorRole(this.color)}"
      type="button"
      ?disabled=${disabled}
      @click=${this.#onClick}
    >
      <span part="prefix" ?hidden=${!this.#hasPrefix}
        ><slot name="prefix" @slotchange=${this.#onPrefixChange}></slot
      ></span>
      <span part="label"><slot></slot></span>
      <span part="suffix" ?hidden=${!this.#hasSuffix}
        ><slot name="suffix" @slotchange=${this.#onSuffixChange}></slot
      ></span>
    </button>`;
  }

  #onPrefixChange(event: Event): void {
    this.#hasPrefix = hasContent(event);
    this.requestUpdate();
  }

  #onSuffixChange(event: Event): void {
    this.#hasSuffix = hasContent(event);
    this.requestUpdate();
  }

  readonly #onFormKeydown = (event: KeyboardEvent): void => {
    const form = this.#form;
    if (form === null || this.type !== 'submit') return;
    if (event.key !== 'Enter' || event.defaultPrevented || event.isComposing) return;
    const target = event.composedPath()[0];
    if (!(target instanceof HTMLInputElement) || !implicitSubmitTypes.has(target.type) || target.form !== form) return;
    const elements = [...form.elements];
    // A native submit button is the form's default button; the platform handles Enter.
    if (elements.some(isNativeSubmit)) return;
    const first = elements.find((element) => element instanceof MbButton && element.type === 'submit');
    if (first !== this) return;
    event.preventDefault();
    if (!this.disabled && !this.#formDisabled) form.requestSubmit();
  };

  #onClick(): void {
    if (this.type === 'submit') this.#internals.form?.requestSubmit();
    else if (this.type === 'reset') this.#internals.form?.reset();
  }
}

function hasContent(event: Event): boolean {
  return (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
}
