import { LitElement, html } from 'lit';
import { optionStyles } from './option.styles.ts';

/**
 * An option in an `mb-listbox`. The listbox writes its `role`,
 * `aria-selected`, `aria-disabled`, and `tabindex`.
 *
 * @tag mb-option
 * @slot - The label.
 * @slot prefix - Content before the label.
 * @slot suffix - Content after the label.
 * @csspart base - The row.
 * @csspart check - The checkbox, shown when the listbox is `multiple`.
 * @csspart prefix - The prefix wrapper.
 * @csspart label - The label wrapper.
 * @csspart suffix - The suffix wrapper.
 * @cssprop --mb-option-fg - Text color.
 * @cssprop --mb-option-bg-hover - Background on hover.
 * @cssprop --mb-option-bg-selected - Background when selected. Defaults to the listbox color role's subtle token.
 * @cssprop --mb-option-fg-selected - Text color when selected.
 * @cssprop --mb-option-radius - Corner radius.
 * @cssprop --mb-option-gap - Space between check, prefix, label, and suffix.
 * @cssprop --mb-option-padding-block - Vertical padding.
 * @cssprop --mb-option-padding-inline - Horizontal padding.
 * @cssprop --mb-option-height - Minimum height. Defaults to the listbox size.
 * @cssprop --mb-option-font-size - Font size. Defaults to the listbox size.
 * @cssprop --mb-option-icon-size - Size of the checkbox. Defaults to the listbox size.
 */
export class MbOption extends LitElement {
  static override styles = optionStyles;
  static override properties = {
    value: { noAccessor: true },
    disabled: { type: Boolean, reflect: true },
    defaultSelected: { type: Boolean, attribute: 'selected' },
  };

  declare disabled: boolean;
  /** Selected when the listbox first connects and after a form reset, like `<option selected>`. */
  declare defaultSelected: boolean;

  #value: string | undefined;

  constructor() {
    super();
    this.disabled = false;
    this.defaultSelected = false;
  }

  /** The submitted value. Defaults to the text content. */
  get value(): string {
    return this.#value ?? this.textContent?.trim() ?? '';
  }

  set value(value: string | null | undefined) {
    const old = this.value;
    this.#value = value ?? undefined;
    this.requestUpdate('value', old);
  }

  /** Whether the option is currently selected. Change the selection on the listbox. */
  get selected(): boolean {
    return this.getAttribute('aria-selected') === 'true';
  }

  override render() {
    return html`<div part="base">
      <span part="check"></span>
      <span part="prefix"><slot name="prefix"></slot></span>
      <span part="label"><slot></slot></span>
      <span part="suffix"><slot name="suffix"></slot></span>
    </div>`;
  }
}
