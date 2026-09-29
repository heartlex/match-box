import { MbField } from '../field/field.ts';
import { define } from '../shared/define.ts';

define('mb-field', MbField);

declare global {
  interface HTMLElementTagNameMap {
    'mb-field': MbField;
  }
}
