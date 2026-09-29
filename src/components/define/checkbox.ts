import { MbCheckbox } from '../checkbox/checkbox.ts';
import { define } from '../shared/define.ts';

define('mb-checkbox', MbCheckbox);

declare global {
  interface HTMLElementTagNameMap {
    'mb-checkbox': MbCheckbox;
  }
}
