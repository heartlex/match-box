import { LitElement, html } from 'lit';
import { DisclosureController } from '../../lit/controllers.ts';
import { colorRole, type ColorRole } from '../shared/color.ts';
import { disclosureStyles } from './disclosure.styles.ts';

/**
 * A button that shows and hides a panel.
 *
 * @tag mb-disclosure
 * @slot summary - The trigger text.
 * @slot - The panel content.
 * @csspart heading - The heading wrapper, present when `heading-level` is set.
 * @csspart trigger - The button.
 * @csspart summary - The trigger text wrapper.
 * @csspart icon - The chevron.
 * @csspart panel - The panel.
 * @cssstate open - The panel is shown.
 * @cssprop --mb-disclosure-border-color - Divider below the disclosure.
 * @cssprop --mb-disclosure-trigger-bg - Trigger background.
 * @cssprop --mb-disclosure-trigger-bg-hover - Trigger background on hover.
 * @cssprop --mb-disclosure-trigger-fg - Trigger text color.
 * @cssprop --mb-disclosure-font-weight - Trigger font weight.
 * @cssprop --mb-disclosure-padding-block - Trigger vertical padding.
 * @cssprop --mb-disclosure-padding-inline - Trigger and panel horizontal padding.
 * @cssprop --mb-disclosure-panel-padding-block - Panel vertical padding.
 * @fires toggle - After the panel opens or closes, by the user or in code. A `ToggleEvent` with `newState` and `oldState`.
 */
export class MbDisclosure extends LitElement {
  static override styles = disclosureStyles;
  static override properties = {
    open: { type: Boolean, reflect: true, noAccessor: true },
    color: {},
    headingLevel: { type: Number, attribute: 'heading-level' },
  };

  declare color: ColorRole;
  /** Wraps the trigger in a heading of this level (1 to 6). Required inside an accordion. */
  declare headingLevel: number | undefined;

  /** The underlying controller; `mb-accordion` coordinates its state. */
  readonly disclosure = new DisclosureController(this, () => ({
    trigger: this.renderRoot.querySelector<HTMLElement>('[part=trigger]'),
    panel: this.renderRoot.querySelector<HTMLElement>('[part=panel]'),
  }));

  readonly #internals: ElementInternals;

  constructor() {
    super();
    this.color = 'neutral';
    this.headingLevel = undefined;
    this.#internals = this.attachInternals();
    this.disclosure.state.subscribe(() => {
      const { expanded } = this.disclosure.state;
      this.requestUpdate('open', !expanded);
      if (expanded) this.#internals.states.add('open');
      else this.#internals.states.delete('open');
      this.dispatchEvent(
        new ToggleEvent('toggle', {
          newState: expanded ? 'open' : 'closed',
          oldState: expanded ? 'closed' : 'open',
        }),
      );
    });
  }

  /** Whether the panel is shown. Applies to the state immediately, so an accordion sees it at once. */
  get open(): boolean {
    return this.disclosure.state.expanded;
  }

  set open(open: boolean) {
    if (open) this.disclosure.state.open();
    else this.disclosure.state.close();
  }

  override render() {
    const trigger = html`<button part="trigger" class="color-${colorRole(this.color)}" type="button">
      <span part="summary"><slot name="summary"></slot></span>
      <span part="icon"></span>
    </button>`;
    const level = this.headingLevel;
    return html`${level !== undefined && level >= 1 && level <= 6
        ? html`<div part="heading" role="heading" aria-level=${level}>${trigger}</div>`
        : trigger}
      <div part="panel" ?hidden=${!this.disclosure.state.expanded}><slot></slot></div>`;
  }
}
