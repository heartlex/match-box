import { LitElement, html, type PropertyValues } from 'lit';
import { AccordionController } from '../../lit/controllers.ts';
import { MbDisclosure } from '../disclosure/disclosure.ts';
import { accordionStyles } from './accordion.styles.ts';

/**
 * A stack of disclosures. By default, opening one closes the others.
 *
 * @tag mb-accordion
 * @slot - `mb-disclosure` elements.
 * @csspart base - The wrapper around the disclosures.
 * @cssprop --mb-accordion-border-color - Divider above the first disclosure.
 */
export class MbAccordion extends LitElement {
  static override styles = accordionStyles;
  static override properties = {
    multiple: { type: Boolean, reflect: true },
    headingLevel: { type: Number, attribute: 'heading-level' },
  };

  /** Allow several disclosures to be open at once. */
  declare multiple: boolean;
  /** Heading level for disclosures that do not set their own. Defaults to 3. */
  declare headingLevel: number;

  readonly accordion = new AccordionController(this, () => ({
    items: () => this.#disclosures().map((disclosure) => disclosure.disclosure),
  }));

  constructor() {
    super();
    this.multiple = false;
    this.headingLevel = 3;
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (changed.has('multiple')) this.accordion.state.setMultiple(this.multiple);
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    for (const disclosure of this.#disclosures()) {
      if (!disclosure.hasAttribute('heading-level')) disclosure.headingLevel = this.headingLevel;
    }
  }

  override render() {
    return html`<div part="base"><slot @slotchange=${() => this.requestUpdate()}></slot></div>`;
  }

  #disclosures(): MbDisclosure[] {
    return [...this.children].filter((child): child is MbDisclosure => child instanceof MbDisclosure);
  }
}
