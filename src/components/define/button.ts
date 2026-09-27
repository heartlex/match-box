import { MbButton } from '../button/button.ts';
import { define } from '../shared/define.ts';

define('mb-button', MbButton);

declare global {
  interface HTMLElementTagNameMap {
    'mb-button': MbButton;
  }
}
