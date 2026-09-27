import { MbAccordion } from '../accordion/accordion.ts';
import { define } from '../shared/define.ts';
import './disclosure.ts';

define('mb-accordion', MbAccordion);

declare global {
  interface HTMLElementTagNameMap {
    'mb-accordion': MbAccordion;
  }
}
