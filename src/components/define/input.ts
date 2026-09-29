import { MbInput } from '../input/input.ts';
import { define } from '../shared/define.ts';

define('mb-input', MbInput);

declare global {
  interface HTMLElementTagNameMap {
    'mb-input': MbInput;
  }
}
