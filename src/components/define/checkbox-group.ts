import { MbCheckboxGroup } from '../checkbox-group/checkbox-group.ts';
import { MbCheckbox } from '../checkbox/checkbox.ts';
import { define } from '../shared/define.ts';

define('mb-checkbox', MbCheckbox);
define('mb-checkbox-group', MbCheckboxGroup);

declare global {
  interface HTMLElementTagNameMap {
    'mb-checkbox-group': MbCheckboxGroup;
  }
}
