import { define } from '../shared/define.ts';
import { MbSwitch } from '../switch/switch.ts';

define('mb-switch', MbSwitch);

declare global {
  interface HTMLElementTagNameMap {
    'mb-switch': MbSwitch;
  }
}
