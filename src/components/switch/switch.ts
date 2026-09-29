import { html } from 'lit';
import { live } from 'lit/directives/live.js';
import { colorRole } from '../shared/color.ts';
import { fieldText } from '../shared/field-control.ts';
import { sizeName } from '../shared/size.ts';
import { ToggleBase } from '../shared/toggle.ts';
import { switchStyles } from './switch.styles.ts';

/**
 * An on/off switch, submitted with its form as `name=value` when on.
 *
 * @tag mb-switch
 * @slot - The label.
 * @csspart base - The clickable label around track and text.
 * @csspart track - The track.
 * @csspart thumb - The thumb.
 * @csspart label - The wrapper of the label slot.
 * @cssstate invalid - `required` and off.
 * @cssstate user-invalid - Invalid after the user toggled it and left, or a submit was attempted.
 * @cssprop --mb-switch-track-width - Track width.
 * @cssprop --mb-switch-track-height - Track height.
 * @cssprop --mb-switch-thumb-size - Thumb size.
 * @cssprop --mb-switch-track-bg - Track background when off.
 * @cssprop --mb-switch-track-bg-checked - Track background when on.
 * @cssprop --mb-switch-thumb-bg - Thumb background.
 * @cssprop --mb-switch-duration - Duration of the thumb and track transitions.
 * @fires input - When the user toggles it.
 * @fires change - When the user toggles it.
 */
export class MbSwitch extends ToggleBase {
  static override styles = switchStyles;

  override render() {
    return html`${fieldText(this)}${this.ownLabel()}
      <label part="base" class="color-${colorRole(this.color)} size-${sizeName(this.size)}">
        <input
          type="checkbox"
          role="switch"
          .checked=${live(this.checked)}
          ?disabled=${this.inputDisabled}
          ?required=${this.required && !this.grouped}
          @change=${(event: Event) => this.toggleFromInput(event)}
        />
        <span part="track" aria-hidden="true"><span part="thumb"></span></span>
        <span part="label"><slot @slotchange=${this.onLabelSlotChange}></slot></span>
      </label>`;
  }
}
