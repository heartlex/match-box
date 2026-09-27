import { MbListbox } from '../listbox/listbox.ts';
import { MbOption } from '../listbox/option.ts';
import { define } from '../shared/define.ts';

define('mb-option', MbOption);
define('mb-listbox', MbListbox);

declare global {
  interface HTMLElementTagNameMap {
    'mb-listbox': MbListbox;
    'mb-option': MbOption;
  }
}
