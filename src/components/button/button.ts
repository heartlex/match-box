import { LitElement, html } from 'lit';
import { DelegatesFocus } from '../../lit/delegates-focus.ts';
import { colorRole, type ColorRole } from '../shared/color.ts';
import { buttonStyles } from './button.styles.ts';

export type ButtonVariant = 'default' | 'outline' | 'ghost';
export type ButtonType = 'button' | 'submit' | 'reset';

/**
 * A button.
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

  #onClick(): void {
    if (this.type === 'submit') this.#internals.form?.requestSubmit();
    else if (this.type === 'reset') this.#internals.form?.reset();
  }
}

function hasContent(event: Event): boolean {
  return (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
}
