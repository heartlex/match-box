import { expect } from 'chai';
import { sendKeys } from '@web/test-runner-commands';
import '../../../src/components/define/all.ts';
import type { MbSwitch } from '../../../src/components/index.ts';
import { nameOf } from '../../../src/core/testing/names.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, settle } from '../../support/components.ts';

const inner = (element: Element): HTMLInputElement =>
  element.shadowRoot?.querySelector('input') as HTMLInputElement;

describe('mb-switch', () => {
  before(loadTokens);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('is a named switch that toggles with Space', async () => {
    const { element: form } = await mount<HTMLFormElement>('<form><mb-switch name="mail">Email me</mb-switch></form>');
    const toggle = form.querySelector('mb-switch') as MbSwitch;
    expect(inner(toggle).getAttribute('role')).to.equal('switch');
    expect(nameOf(inner(toggle))).to.equal('Email me');
    toggle.focus();
    await sendKeys({ press: 'Space' });
    await settle(document.body);
    expect([toggle.checked, inner(toggle).checked]).to.deep.equal([true, true]);
    expect(new FormData(form).get('mail')).to.equal('on');
    await expectNoAxeViolations(form);
  });

  it('resets to the checked attribute', async () => {
    const { element: form } = await mount<HTMLFormElement>('<form><mb-switch checked>Wi-Fi</mb-switch></form>');
    const toggle = form.querySelector('mb-switch') as MbSwitch;
    toggle.checked = false;
    await settle(document.body);
    form.reset();
    await settle(document.body);
    expect(toggle.checked).to.equal(true);
  });
});
