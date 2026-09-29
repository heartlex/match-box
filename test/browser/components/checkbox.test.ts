import { expect } from 'chai';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
import '../../../src/components/define/all.ts';
import type { MbCheckbox } from '../../../src/components/index.ts';
import { nameOf, referencedText } from '../../../src/core/testing/names.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, part, resolveColor, settle } from '../../support/components.ts';

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

  // Fix round 1

  it('keeps a checked property set before the first update', async () => {
    const box = document.createElement('mb-checkbox');
    box.checked = true;
    document.body.append(box);
    await settle(document.body);
    expect(box.checked).to.equal(true);
    expect(inner(box).checked).to.equal(true);
  });

  it('ignores a later checked attribute change once the user has toggled the box', async () => {
    const { box } = await inForm('<mb-checkbox>Accept</mb-checkbox>');
    await clickLabel(box);
    await clickLabel(box);
    expect(box.checked).to.equal(false);
    box.setAttribute('checked', '');
    await settle(document.body);
    expect(box.checked).to.equal(false);
  });

  it('reapplies the checked attribute after a reset clears dirtiness', async () => {
    const { form, box } = await inForm('<mb-checkbox>Accept</mb-checkbox>');
    await clickLabel(box);
    form.reset();
    await settle(document.body);
    expect(box.checked).to.equal(false);
    box.setAttribute('checked', '');
    await settle(document.body);
    expect(box.checked).to.equal(true);
  });

  it('treats a reset-matching checked assignment as dirty', async () => {
    const { form, box } = await inForm('<mb-checkbox checked>Accept</mb-checkbox>');
    form.reset();
    await settle(document.body);
    expect(box.checked).to.equal(true);
    box.checked = true;
    await settle(document.body);
    box.removeAttribute('checked');
    await settle(document.body);
    expect(box.checked).to.equal(true);
  });

  it('keeps a property-set value across a reset', async () => {
    const { form, box } = await inForm('<mb-checkbox name="terms" checked>Accept</mb-checkbox>');
    box.value = 'yes';
    box.checked = true;
    await settle(document.body);
    form.reset();
    await settle(document.body);
    expect(new FormData(form).get('terms')).to.equal('yes');
  });

  it('updates the hidden label copy when slotted text changes in place', async () => {
    const { box } = await inForm('<mb-checkbox><span>Accept</span></mb-checkbox>');
    const span = box.querySelector('span') as HTMLSpanElement;
    span.textContent = 'Agree';
    await settle(document.body);
    expect(nameOf(inner(box))).to.equal('Agree');
  });

  it('toggles and fires one change on click(), like a native checkbox', async () => {
    const { box } = await inForm('<mb-checkbox>Accept</mb-checkbox>');
    let changes = 0;
    box.addEventListener('change', () => (changes += 1));
    box.click();
    await settle(document.body);
    expect(box.checked).to.equal(true);
    expect(changes).to.equal(1);
  });

  it('does nothing on click() when disabled', async () => {
    const { box } = await inForm('<mb-checkbox disabled>Accept</mb-checkbox>');
    box.click();
    await settle(document.body);
    expect(box.checked).to.equal(false);
  });

  it('keeps the mark visible on a disabled checked box', async () => {
    const { box } = await inForm('<mb-checkbox color="primary" checked disabled>Accept</mb-checkbox>');
    const mark = getComputedStyle(part(box, 'mark'));
    const square = getComputedStyle(part(box, 'box'));
    expect(mark.stroke).to.equal(resolveColor('--mb-color-fg-disabled'));
    expect(mark.stroke).to.not.equal(square.backgroundColor);
  });

  // Controller ruling: a grouped checkbox must not validate on its own.
  it('a required checkbox inside a group is valid on its own', async () => {
    const { element } = await mount<HTMLElement>(
      '<mb-checkbox-group name="topping"><mb-checkbox value="nuts" required>Nuts</mb-checkbox></mb-checkbox-group>',
    );
    const box = element.querySelector('mb-checkbox') as MbCheckbox;
    await settle(document.body);
    expect(box.validity.valueMissing).to.equal(false);
    expect(box.validity.valid).to.equal(true);
  });

  it('a checked checkbox with a name moved out of a group into a form submits its value', async () => {
    const { element: group } = await mount<HTMLElement>(
      '<mb-checkbox-group name="topping"><mb-checkbox value="nuts" name="nuts" checked>Nuts</mb-checkbox></mb-checkbox-group>',
    );
    const box = group.querySelector('mb-checkbox') as MbCheckbox;
    const { element: form } = await mount<HTMLFormElement>('<form></form>');
    form.append(box);
    await settle(document.body);
    expect(new FormData(form).get('nuts')).to.equal('nuts');
  });
});
