import { MbDisclosure } from '../disclosure/disclosure.ts';
import { define } from '../shared/define.ts';

define('mb-disclosure', MbDisclosure);

declare global {
  interface HTMLElementTagNameMap {
    'mb-disclosure': MbDisclosure;
  }
}
