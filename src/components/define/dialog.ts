import { MbDialog } from '../dialog/dialog.ts';
import './button.ts';
import { define } from '../shared/define.ts';

define('mb-dialog', MbDialog);

declare global {
  interface HTMLElementTagNameMap {
    'mb-dialog': MbDialog;
  }
}
