import { expect } from 'chai';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
import '../../../src/components/define/all.ts';
import type { MbCheckbox } from '../../../src/components/index.ts';
import { nameOf, referencedText } from '../../../src/core/testing/names.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, part, settle } from '../../support/components.ts';

const inner = (element: Element): HTMLInputElement =>
  element.shadowRoot?.querySelector('input') as HTMLInputElement;

async function inForm(markup: string): Promise<{ form: HTMLFormElement; box: MbCheckbox }> {
  const { element: form } = await mount<HTMLFormElement>(`<form>${markup}</form>`);
  return { form, box: form.querySelector('mb-checkbox') as MbCheckbox };
}

async function clickLabel(box: MbCheckbox): Promise<void> {
  const rect = part(box, 'label').getBoundingClientRect();
  await sendMouse({ type: 'click', position: [Math.round(rect.left + 4), Math.round(rect.top + rect.height / 2)] });
  await settle(document.body);
}

describe('mb-checkbox', () => {
  before(loadTokens);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('is named by its label and toggles with Space and a label click', async () => {
    const { box } = await inForm('<mb-checkbox name="terms">Accept</mb-checkbox>');
    expect(nameOf(inner(box))).to.equal('Accept');
    box.focus();
    await sendKeys({ press: 'Space' });
    await settle(document.body);
    expect(box.checked).to.equal(true);
    await clickLabel(box);
    expect(box.checked).to.equal(false);
    await expectNoAxeViolations(box);
  });

  it('submits name=value only when checked, with value on by default', async () => {
    const { form, box } = await inForm('<mb-checkbox name="terms">Accept</mb-checkbox>');
    expect(new FormData(form).has('terms')).to.equal(false);
    box.checked = true;
    await settle(document.body);
    expect(new FormData(form).get('terms')).to.equal('on');
    box.value = 'yes';
    await settle(document.body);
    expect(new FormData(form).get('terms')).to.equal('yes');
  });

  it('requires being checked when required', async () => {
    const { box } = await inForm('<mb-checkbox required>Accept</mb-checkbox>');
    expect([box.validity.valueMissing, box.validationMessage]).to.deep.equal([
      true,
      'Please check this box if you want to proceed.',
    ]);
    box.checked = true;
    await settle(document.body);
    expect(box.validity.valid).to.equal(true);
  });

  it('resets to the checked attribute', async () => {
    const { form, box } = await inForm('<mb-checkbox checked>Accept</mb-checkbox>');
    expect(box.checked).to.equal(true);
    await clickLabel(box);
    expect(box.checked).to.equal(false);
    form.reset();
    await settle(document.body);
    expect(box.checked).to.equal(true);
  });

  it('shows indeterminate as mixed and clears it when toggled', async () => {
    const { box } = await inForm('<mb-checkbox indeterminate>All</mb-checkbox>');
    expect(inner(box).indeterminate).to.equal(true);
    await clickLabel(box);
    expect([box.indeterminate, inner(box).indeterminate, box.checked]).to.deep.equal([false, false, true]);
  });

  it('dispatches one change per user toggle', async () => {
    const { box } = await inForm('<mb-checkbox>Accept</mb-checkbox>');
    let changes = 0;
    box.addEventListener('change', () => (changes += 1));
    await clickLabel(box);
    box.checked = false;
    await settle(document.body);
    expect(changes).to.equal(1);
  });

  it('does not toggle or submit inside a disabled fieldset', async () => {
    const { form, box } = await inForm('<fieldset disabled><mb-checkbox name="t" checked>Accept</mb-checkbox></fieldset>');
    expect(inner(box).disabled).to.equal(true);
    await clickLabel(box);
    expect(box.checked).to.equal(true);
    expect(new FormData(form).has('t')).to.equal(false);
  });

  it('inside mb-field, is named by the field label and its own label, and described by the field', async () => {
    const { element } = await mount<HTMLElement>(
      '<mb-field label="Terms" description="Required to continue."><mb-checkbox>Accept</mb-checkbox></mb-field>',
    );
    const box = element.querySelector('mb-checkbox') as MbCheckbox;
    await settle(document.body);
    expect(nameOf(inner(box))).to.equal('Terms Accept');
    expect(referencedText(inner(box), 'describedby')).to.equal('Required to continue.');
  });
});
