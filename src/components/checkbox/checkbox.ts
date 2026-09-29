import { html, svg } from 'lit';
import { live } from 'lit/directives/live.js';
import { colorRole } from '../shared/color.ts';
import { fieldText } from '../shared/field-control.ts';
import { sizeName } from '../shared/size.ts';
import { ToggleBase } from '../shared/toggle.ts';
import { checkboxStyles } from './checkbox.styles.ts';

/**
 * A checkbox, submitted with its form as `name=value` when checked.
 *
 * @tag mb-checkbox
 * @slot - The label.
 * @csspart base - The clickable label around box and text.
 * @csspart box - The box.
 * @csspart mark - The check or dash, an SVG.
 * @csspart label - The wrapper of the label slot.
 * @cssstate invalid - `required` and unchecked.
 * @cssstate user-invalid - Invalid after the user toggled it and left, or a submit was attempted.
 * @cssprop --mb-checkbox-size - Box size. Defaults to the size scale's icon size.
 * @cssprop --mb-checkbox-bg - Box background.
 * @cssprop --mb-checkbox-border-color - Box border color.
 * @cssprop --mb-checkbox-border-color-hover - Box border color on hover.
 * @cssprop --mb-checkbox-bg-checked - Box background when checked or indeterminate.
 * @cssprop --mb-checkbox-mark-color - Check and dash color.
 * @cssprop --mb-checkbox-radius - Box corner radius.
 * @cssprop --mb-checkbox-gap - Space between box and label.
 * @cssprop --mb-checkbox-duration - Duration of the color transition.
 * @fires input - When the user toggles it.
 * @fires change - When the user toggles it.
 */
export class MbCheckbox extends ToggleBase {
  static override styles = checkboxStyles;
  static override properties = {
    indeterminate: { type: Boolean, reflect: true },
  };

  /** Shows a dash, exposed as mixed. Cleared when the user toggles. */
  declare indeterminate: boolean;

  constructor() {
    super();
    this.indeterminate = false;
  }

  protected override toggleFromInput(event: Event): void {
    this.indeterminate = false;
    super.toggleFromInput(event);
  }

  override render() {
    return html`${fieldText(this)}${this.ownLabel()}
      <label part="base" class="color-${colorRole(this.color)} size-${sizeName(this.size)}">
        <input
          type="checkbox"
          .checked=${live(this.checked)}
          .indeterminate=${this.indeterminate}
          ?disabled=${this.inputDisabled}
          ?required=${this.required && !this.grouped}
          @change=${(event: Event) => this.toggleFromInput(event)}
        />
        <span part="box" aria-hidden="true"
          ><svg part="mark" viewBox="0 0 16 16">
            ${this.indeterminate ? svg`<path d="M4 8h8" />` : svg`<path d="M3.5 8.5l3 3 6-7" />`}
          </svg></span
        >
        <span part="label"><slot @slotchange=${this.onLabelSlotChange}></slot></span>
      </label>`;
  }
}
